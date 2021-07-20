package gateway

import (
	"context"
	"sync"
	"time"

	"nhooyr.io/websocket"
)

// Session contains websocket, gateway and current heartbeat information
type Session struct {
	sync.RWMutex
	wsMutex     sync.Mutex
	wsConn      *websocket.Conn
	wsCtx       context.Context
	wsCtxCancel context.CancelFunc

	URL    string
	ID     string
	Secret string

	HeartbeatInterval time.Duration
	Ping              time.Duration
	listening         chan bool
}

type HeartbeatTimer struct {
	sync.RWMutex
	time time.Time
}
