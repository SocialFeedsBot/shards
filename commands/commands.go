package commands

import (
	"github.com/bwmarrin/discordgo"
)

type Command struct {
	Name        string
	Description string
	Usage       string
	Category    string
	OwnerOnly   bool
	Args        map[string]bool
	Run         func(s *discordgo.Session, m *discordgo.MessageCreate, params []string) error
}

var (
	Commands map[string]Command
)

func (c Command) Register() {
	if Commands == nil {
		Commands = make(map[string]Command)
	}
	Commands[c.Name] = c
}
