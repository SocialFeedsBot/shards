package commands

import (
	"fmt"
	"time"

	"github.com/bwmarrin/discordgo"
)

func pingCommand(s *discordgo.Session, m *discordgo.MessageCreate, params []string) error {
	before := time.Now()
	msg, err := s.ChannelMessageSend(m.ChannelID, "ping")
	if err != nil {
		return err
	}
	elapsed := time.Since(before)

	s.ChannelMessageEdit(m.ChannelID, msg.ID, fmt.Sprintf("Pong! %vms", elapsed.Milliseconds()))
	return nil
}

func init() {
	ping := Command{
		Name:        "ping",
		Usage:       "ping",
		Description: "Test the bot latency",
		Category:    "Misc",
		Args:        map[string]bool{},
		OwnerOnly:   false,
		Run:         pingCommand,
	}

	ping.Register()
}
