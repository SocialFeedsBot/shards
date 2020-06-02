package commands

import (
	"fmt"
	"os"
	"strings"

	"github.com/bwmarrin/discordgo"
)

func CheckCommands(s *discordgo.Session, m *discordgo.MessageCreate) {
	if !strings.HasPrefix(m.Content, os.Getenv("BOT_PREFIX")) {
		return
	}

	content := strings.TrimPrefix(m.Content, os.Getenv(("BOT_PREFIX")))
	command := strings.Split(content, " ")

	if len(command) < 1 {
		return
	}

	go RunCommand(s, m, command)
}

func RunCommand(s *discordgo.Session, m *discordgo.MessageCreate, command []string) {
	if cmd, ok := Commands[command[0]]; ok {
		defer func() {
			if err := recover(); err != nil {
				s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Unhandled panic: %v", err))
				return
			}
		}()

		parameters := command[1:]
		err := cmd.Run(s, m, parameters)
		if err != nil {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Command error: %v", err))
		}
	}
}
