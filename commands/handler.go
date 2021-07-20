package commands

import (
	"os"
	"strings"

	"github.com/SocialFeedsBot/worker/internal/shardmanager"
	"github.com/bwmarrin/discordgo"
	"github.com/sirupsen/logrus"
)

var manager *shardmanager.Manager

func handler(s *discordgo.Session, msg *discordgo.MessageCreate) {
	// Check for prefix
	if !strings.HasPrefix(strings.ToLower(msg.Content), os.Getenv("PREFIX")) {
		return
	}
	if msg.GuildID == "" {
		s.ChannelMessageSend(msg.ChannelID, "I don't reply in Direct Messages, add me to a server and try again. <https://socialfeeds.app>")
		return
	}

	// Remove the prefix to be left with the message content
	content := strings.TrimPrefix(msg.Content, os.Getenv("PREFIX"))
	command := strings.Split(content, " ")

	// Check if there's actually a command
	if len(command) < 1 {
		return
	}

	if cmd, ok := Commands[command[0]]; ok {
		parameters := command[1:]

		err := cmd.Run(&Context{
			Manager: manager,
			Message: msg,
			Session: s,
		}, parameters)
		logrus.Debug("Command: " + cmd.Name + " " + strings.Join(parameters, " "))
		if err != nil {
			logrus.Error("Command error: " + cmd.Name + " - " + err.Error())
			return
		}
	}
}

func AddHandler(mg *shardmanager.Manager) {
	manager = mg
	mg.AddHandler(handler)
}
