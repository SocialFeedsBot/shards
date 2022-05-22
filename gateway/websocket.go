package gateway

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/SocialFeedsBot/shards/health"
	"github.com/sirupsen/logrus"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

var (
	ErrWebsocketClosed = errors.New("websocket closed")

	// Set our timer so we can measure latency
	timer = HeartbeatTimer{}
)

// heartbeat sends the heartbeat OP code every interval requested
func (s *Session) heartbeat() {
	s.Lock()
	ticker := time.NewTicker(s.HeartbeatInterval)
	s.Unlock()

	defer ticker.Stop()

heartbeat:
	for {
		timer.Lock()
		timer.time = time.Now()
		timer.Unlock()

		s.send(Packet{
			OPCode: OPCodeHeartbeat,
		})
		logrus.Traceln("Heartbeat Sent")

		select {
		case <-ticker.C:
			// continue loop and send heartbeat
		case <-s.listening:
			logrus.Traceln("Heartbeat aborted")
			break heartbeat
		}
	}
}

// send a packet over the websocket
func (s *Session) send(packet interface{}) error {
	// Make sure gateway websocket writes do not happen concurrently
	s.wsMutex.Lock()
	err := wsjson.Write(s.wsCtx, s.wsConn, packet)
	s.wsMutex.Unlock()

	// Check if the websocket is closed
	closeError := errors.As(err, &websocket.CloseError{})
	if closeError {
		logrus.Warnln("Websocket closed, unable to write")
		s.reconnect()
		return ErrWebsocketClosed
	}

	// Other unhandled error
	if err != nil {
		logrus.Error(err)
		return err
	}
	return nil
}

// listen polls the websocket connection for events, it will stop when the
// listening channel (s.listening) is closed, or an error occurs.
func (s *Session) listen() {
	listeningSessionErrorCount := 0

listener:
	for {
		var packet Packet
		err := wsjson.Read(s.wsCtx, s.wsConn, &packet)

		// Check if the websocket is closed
		closeError := errors.As(err, &websocket.CloseError{})
		if closeError {
			// Simply exit the listener if websocket is closed
			logrus.Debug("The connection was closed")
			break listener
		}

		// If there is an error that is not related to a closed websocket
		if (err != nil) && (!closeError) {
			listeningSessionErrorCount++
			logrus.Warnf("error reading packet from websocket, skipping...  %s", err)
			if listeningSessionErrorCount > 4 {
				logrus.Error("Aborting broken connection due to increased error rates. Going to reconnect")
				s.reconnect()
				break listener
			}
		}

		select {
		// If listening channel closed
		case <-s.listening:
			break listener
		default:
			go s.deploy(packet)
		}
	}
}

// deploy handles the packet and runs code or calls functions based on the OPCode
func (s *Session) deploy(packet Packet) {
	switch packet.OPCode {
	case OPCodeHello:
		{
			var data map[string]interface{}
			err := json.Unmarshal(packet.Data, &data)
			if err != nil {
				logrus.Error(err)
				return
			}
			s.HeartbeatInterval = time.Duration(data["heartbeat_interval"].(float64)) * time.Millisecond
			logrus.Tracef("Gateway requested a hearbeat interval of: %v", s.HeartbeatInterval)

			// Now we have the hello code, start heartbeat and identify our handler to the gateway
			go s.heartbeat()

			s.Lock()
			sessionID := s.ID
			s.Unlock()

			if sessionID == "" {
				s.identify(OPCodeIdentify)
			} else {
				s.identify(OPCodeResume)
			}
		}

	case OPCodeReady:
		{
			var data map[string]interface{}
			err := json.Unmarshal(packet.Data, &data)
			if err != nil {
				logrus.Error(err)
			}

			if data["id"] == nil {
				logrus.Warnf("An OP ready code was sent without a recognisable ID: '%v'", data["id"])
				break
			}

			sentID := data["id"].(string)

			s.Lock()
			existingSession := s.ID == sentID
			s.ID = sentID
			s.Unlock()

			comment := "a new"
			if existingSession {
				comment = "an existing"
			}
			logrus.Infof("Connected to %v session with ID: %v", comment, sentID)

			// Only send a ready OP back if we have not already within this process
			if !existingSession {
				s.send(Packet{
					OPCode: OPCodeReady,
				})
			}
		}

	case OPCodeHeartbeatAck:
		{
			s.Lock()
			timer.Lock()
			s.Ping = time.Since(timer.time)
			timer.Unlock()
			s.Unlock()
			logrus.Tracef("Heartbeat Acknowledged: %vms", int64(s.Ping/time.Millisecond))
		}

	case OPCodeAction:
		{
			logrus.Tracef("Action OP Code received")

			switch packet.Type {
			case ActionRequestStats:
				go s.SendStats(packet)
			case ActionRequestServerInfo:
				go s.GetServerInfo(packet)
			case ActionRequestSharedGuilds:
				go s.GetSharedGuilds(packet)
			case ActionRequestRestart:
				s.reconnect()
			}
		}
	default:
		{
			logrus.Debugf("Unknown OP Code received, packet: %v\n", packet)
		}
	}
}

// identify sends the credentials of the handler to the gate way so it can be authenticated correctly
func (s *Session) identify(op OPCode) {
	s.Lock()
	data, err := json.Marshal(Identify{
		Service: "shards",
		Secret:  s.Secret,
		ID:      s.ID,
	})
	s.Unlock()

	if err != nil {
		logrus.Error(err)
	}
	packet := Packet{
		OPCode: op,
		Data:   data,
	}

	s.send(&packet)
}

// reconnect disconnects the websocket, waits for a duration then attempts to connect again
func (s *Session) reconnect() {
	// Lock the session so other functions can not be
	// initiated while we have a reconnect cooldown
	s.Lock()
	logrus.Debugln("Waiting to reconnect")

	// Disconnect from the websocket
	s.disconnect(websocket.StatusNormalClosure, "")

	// Wait a short duration
	time.Sleep(2500 * time.Millisecond)
	logrus.Debugln("Reconnecting")

	// Unlock session so we can call connect
	s.Unlock()
	s.Connect()
}

// disconnect closes the listening channel and websocket gracefully
func (s *Session) disconnect(code websocket.StatusCode, reason string) {
	close(s.listening)

	logrus.Debugln("Closing connection")
	err := s.wsConn.Close(code, reason)
	if err != nil {
		logrus.Warnf("error closing session connection, %s", err)
	}

	// Set to nil so we can check on our connection attempt that
	// a connection does not exist
	s.wsConn = nil
}

// Connect dials the gateway websocket
func (s *Session) Connect() error {
	// Prevent Connect or other major session functions from
	// being called while it is still running.
	s.Lock()
	defer s.Unlock()

	// If the websock is already open, bail out here.
	if s.wsConn != nil {
		logrus.Errorln("already a connection")
		return errors.New("already a connection")
	}

	logrus.Debugf("Connecting to gateway: %v", s.URL)

	s.wsCtx, s.wsCtxCancel = context.Background(), func() {
		logrus.Warnln("context cancel function called, but never assigned")
	}
	c, _, err := websocket.Dial(s.wsCtx, s.URL, nil)
	if err != nil {
		logrus.Error(err)
		s.reconnect()
		return err
	}
	s.wsConn = c

	logrus.Debugln("Connected to gateway")

	// Create listening channel outside of the listen function, as it needs
	// to happen inside the mutex lock and needs to exist before calling the
	// heartbeat which occurs after an OP 'Hello' code and listen go routines.
	s.listening = make(chan bool)

	go s.listen()
	return nil
}

// SendStats gathers and sends the current memory and uptime

func (s *Session) SendStats(packet Packet) {
	logrus.Traceln("Sending stats to websocket")
	stats := health.Health{}
	stats.ID = s.ID

	// Get Uptime
	stats.Uptime = health.GetUptime()

	// Get memory usage
	mem, err := health.GetMemory()
	if err != nil {
		logrus.Errorln(err)
	}

	stats.Memory = mem

	stats.AddShardStatuses(s.ShardManager)

	response, err := json.Marshal(stats)
	if err != nil {
		logrus.Errorln(err)
		return
	}

	s.send(Packet{
		OPCode: OPCodeAction,
		Type:   ActionResolve,
		Data:   response,
		ID:     packet.ID,
	})
}

func (s *Session) GetServerInfo(packet Packet) {
	logrus.Traceln("Getting server info")

	// Unmarshall the data
	var data map[string]string
	err := json.Unmarshal(packet.Data, &data)
	if err != nil {
		logrus.Error(err)
		return
	}

	// packet is what you send to the gateway to get the server info, might have server ID etc.
	session := s.ShardManager.SessionForGuildS(data["guildID"])
	channels, _ := session.GuildChannels(data["guildID"])

	// Marshal your JSON response
	response, err := json.Marshal(channels)
	if err != nil {
		logrus.Errorln(err)
		return
	}

	// Return response
	s.send(Packet{
		OPCode: OPCodeAction,
		Type:   ActionResolve,
		Data:   response,
		ID:     packet.ID,
	})
}

func (s *Session) GetSharedGuilds(packet Packet) {
	logrus.Traceln("Getting shared guilds")

	// Unmarshall the data
	var data []string
	err := json.Unmarshal(packet.Data, &data)
	if err != nil {
		logrus.Error(err)
		return
	}

	// packet is what you send to the gateway to get the server info, might have server ID etc.

	guildIDsPresent := []string{}

	for _, session := range s.ShardManager.Sessions {
		// a.State.Guilds contains a slice of all guilds
		for _, guild := range session.State.Guilds {
			// see if the guild ID is present
			for _, id := range data {
				if id == guild.ID {
					guildIDsPresent = append(guildIDsPresent, guild.ID)
				}
			}
		}
	}

	// Marshal your JSON response
	response, err := json.Marshal(guildIDsPresent)
	if err != nil {
		logrus.Errorln(err)
		return
	}

	// Return response
	s.send(Packet{
		OPCode: OPCodeAction,
		Type:   ActionResolve,
		Data:   response,
		ID:     packet.ID,
	})
}
