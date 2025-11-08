# Thala Demo Simulation

An interactive web-based sandbox environment that simulates Slack and Jira interfaces to demonstrate Thala's incident management capabilities.

## Overview

This demo simulation provides a controlled, scripted environment where you can showcase Thala's features:
- **Slack Interface**: Simulated Slack channel with realistic message threads
- **Jira Interface**: Simulated Jira ticket management
- **Thala Bot Panel**: Real-time display of Thala's automated actions
- **Sequential Flow**: Pre-scripted demo timeline with step-by-step progression

## Features

- 🎭 **Realistic UI**: Authentic Slack and Jira interface designs
- 🎬 **Scripted Demo**: Pre-defined timeline based on real incident scenarios
- ⏯️ **Playback Controls**: Play, pause, next, previous, and reset
- 📊 **Progress Tracking**: Visual progress bar and step counter
- 🎨 **Smooth Animations**: Framer Motion animations for message appearances
- 📱 **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **React 18**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

## Installation

```bash
cd demo-sim
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The demo will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Demo Flow

The demo follows a scripted timeline with 13 steps:

1. **Morning Discussion** - Team notices slow response times
2. **DevOps Response** - Investigation begins
3. **Critical Incident** - Payment gateway goes down (with screenshot)
4. **Team Discussion** - Messages linked to incident
5. **Quick Fix Analysis** - Thala provides combined analysis
6. **Investigation** - Team finds database connection pool issue
7. **Resolution** - Incident automatically resolved
8. **Jira Ticket** - New authentication issue from Jira
9. **Cross-Platform** - Slack discussion linked to Jira ticket
10. **Search Command** - Finding similar past incidents
11. **Quick Fix** - Thala suggests fixes from past incidents
12. **Debugging** - Team identifies Redis configuration issue
13. **Final Resolution** - Jira ticket resolved with attachment

## Controls

- **Play Button**: Auto-play through all steps (5 seconds per step)
- **Pause Button**: Stop auto-play
- **Next/Previous**: Navigate steps manually
- **Reset**: Start from the beginning

## Customization

### Adding New Steps

Edit `src/data/demoScript.js` to add new demo steps:

```javascript
{
  step: 13,
  description: "Your step description",
  slack: [
    {
      id: 'msg-X',
      userId: 'user-id',
      userName: 'User Name',
      text: 'Message text',
      timestamp: new Date().toISOString()
    }
  ],
  jira: [...],
  thala: [...]
}
```

### Styling

- Slack colors: Defined in `tailwind.config.js` under `slack` colors
- Jira colors: Defined in `tailwind.config.js` under `jira` colors
- Global styles: Edit `src/index.css`

## Project Structure

```
demo-sim/
├── src/
│   ├── components/
│   │   ├── DemoController.jsx    # Playback controls
│   │   ├── SlackSimulator.jsx   # Slack interface
│   │   ├── JiraSimulator.jsx    # Jira interface
│   │   └── ThalaBotPanel.jsx    # Thala bot activity
│   ├── data/
│   │   └── demoScript.js        # Demo timeline script
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Notes

- The demo is **read-only** - no actual API calls are made
- All data is simulated and pre-scripted
- Messages appear with smooth animations
- The demo can be paused/resumed at any step
- Perfect for presentations and demos

## License

Part of the Thala project.






