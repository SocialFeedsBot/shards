package commands

import (
	"fmt"

	"github.com/bwmarrin/discordgo"
)

func helpCommand(s *discordgo.Session, m *discordgo.MessageCreate, params []string) error {
	if len(params) < 1 {
		for index, cmd := range Commands {
			fmt.Println(index, cmd.Description)
		}
	}

	return nil
}

func init() {
	help := Command{
		Name:        "help",
		Usage:       "help [command]",
		Description: "View help for a command or view a list of commands",
		Category:    "Misc",
		Args:        map[string]bool{},
		OwnerOnly:   false,
		Run:         helpCommand,
	}

	help.Register()
}
