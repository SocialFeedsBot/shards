// Package gateway sets up and handles connections to the discord bot websocket
package gateway

import (
	"encoding/json"

	"github.com/SocialFeedsBot/shards/internal/shardmanager"
)

// Gateway credentials
type Gateway struct {
	Secret  string
	Address string
}
type OPCodeType struct {
	Name string
	Code OPCode
}
type OPCode int
type Action string

const (
	// OP Codes specified by the gateway
	OPCodeHello        OPCode = 0
	OPCodeIdentify     OPCode = 1
	OPCodeResume       OPCode = 2
	OPCodeReady        OPCode = 3
	OPCodeHeartbeat    OPCode = 4
	OPCodeHeartbeatAck OPCode = 5
	OPCodeAction       OPCode = 6

	ActionResolve             Action = "resolveAction"
	ActionRequestStats        Action = "stats"
	ActionRequestServerInfo   Action = "getGuild"
	ActionRequestSharedGuilds Action = "requestSharedGuilds"
	ActionRequestRestart      Action = "restart"
)

// OPCodeTypes is used to help associate each OPCode when converted to a string
var OPCodeTypes = [...]OPCodeType{
	{Name: "hello", Code: OPCodeHello},
	{Name: "identify", Code: OPCodeIdentify},
	{Name: "resume", Code: OPCodeResume},
	{Name: "ready", Code: OPCodeReady},
	{Name: "heartbeat", Code: OPCodeHeartbeat},
	{Name: "heartbeat ack", Code: OPCodeHeartbeatAck},
	{Name: "action", Code: OPCodeAction},
}

// String displays a useful output when converting an OPCode to a string
func (op OPCode) String() string {
	for _, opcode := range OPCodeTypes {
		if op == opcode.Code {
			return opcode.Name
		}
	}
	return "unknown OP code"
}

// Packet is a simple structure used to receive and send events over the websocket
type Packet struct {
	OPCode OPCode          `json:"op"`
	Data   json.RawMessage `json:"data,omitempty"`

	// May not be included due to the way the gateway is setup
	Type Action `json:"type,omitempty"`
	ID   string `json:"id,omitempty"`
}

// Identify is a helper structure used to send identify payloads where ID may or may not be present
type Identify struct {
	Service string `json:"service"`
	Secret  string `json:"secret"`
	ID      string `json:"id,omitempty"`
}

// CreateSessionWithShardManager creates a new session and starts the initial websocket connection to the gateway
func (gw *Gateway) CreateSessionWithShardManager(shardManager *shardmanager.Manager) *Session {
	// Create a new session
	session := Session{
		URL:          gw.Address,
		Secret:       gw.Secret,
		ShardManager: shardManager,
	}
	session.Connect()

	return &session
}
