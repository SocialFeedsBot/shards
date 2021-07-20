package commands

import (
	"github.com/SocialFeedsBot/worker/internal/shardmanager"
	"github.com/bwmarrin/discordgo"
)

// Command structure
type Command struct {
	Name        string
	Description string
	Aliases     []string
	Permissions []string
	Run         func(c *Context, parameters []string) error
}

type Context struct {
	Manager *shardmanager.Manager
	Session *discordgo.Session
	Message *discordgo.MessageCreate
}

var (
	// Array of command objects
	Commands map[string]Command
)

// Register the command into the array
func (c Command) Register() {
	if Commands == nil {
		Commands = make(map[string]Command)
	}

	Commands[c.Name] = c
}
