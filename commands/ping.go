package commands

import (
	"fmt"
	"time"
)

func pingCommand(c *Context, parameters []string) error {
	currentTime := time.Now()
	msg, err := c.Session.ChannelMessageSend(c.Message.ChannelID, "Pong!")
	if err != nil {
		return err
	}

	elapsed := time.Since(currentTime)
	c.Session.ChannelMessageEdit(c.Message.ChannelID, msg.ID, fmt.Sprintf("Pong! `%vms`", int64(elapsed/time.Millisecond)))

	return err
}

func init() {
	ping := Command{
		Name:        "ping",
		Description: "Ping command",
		Run:         pingCommand,
	}

	ping.Register()
}
