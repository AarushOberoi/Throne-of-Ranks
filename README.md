# 🐉 Throne of Ranks

**A 3D countdown journey to JEE Main.** Travel through the realms of Physics, Chemistry and Mathematics, level up your rank every few days, and face the final boss on exam day.

🔗 **Enter the realm:** https://throneofranks.aarushoberoi.workers.dev

> *"Dragons are not born fearless. They are born stubborn."*

---

## 🎯 What Is This?

Throne of Ranks turns exam preparation into a game. Instead of a plain countdown, you follow an 81-day journey from 1 November to the day before **JEE Main (20 January 2027, 9:00 AM)**. Each day you complete a quest, keep your streak alive and climb the ranks toward the throne.

## ✨ Features

- **Live countdown** to JEE Main in days, hours, minutes and seconds, plus the Session 1 window dates
- **3D Journey map**: scroll or drag through every day of the journey, with each stretch set in its own themed realm
- **Six ranks to climb:** Recruit → Squire → Sworn Sword → Knight → Lord Commander → Sovereign, with a "time until you evolve" indicator
- **Hero stats:** Power, Focus and Courage
- **Daily Decree**: one quest per day (for example, revise a chapter, then do timed MCQs)
- **Seal the quest** to complete the day and add to your streak 🔥
- **Streak tracking** with current streak, best streak and total days done
- **Day planner**: tap any day on the Journey to add goals for it
- **Journey progress** showing the day number out of 81 and the percentage completed
- **Boss at the end:** *Pyraxis, The Three-Headed Dread*, guarding the Final Siege on exam day
- **Day/night toggle**
- **Responsive layout**, safe-area aware on phones
- **No sign-up and no backend:** open it and play

## 🗺️ The Realms

| Realm | Name |
| ----- | ---- |
| I | The Vale of Vectors |
| II | Kinematic Kingswood |
| III | The Mole Marches |
| IV | Calculus Crags |
| V | The Organic Wildwood |
| VI | Ashfall Keep |

Every realm is built around Physics (P), Chemistry (C) and Mathematics (M).

## 🗂️ Project Structure

```
Throne-of-Ranks/
├── index.html    # App shell
├── css/          # Stylesheets
├── js/           # Journey, ranks, quests, streak and countdown logic
├── assets/       # Images and other media
├── vendor/       # Third-party libraries
├── css2          # Font stylesheet
├── download      # (see note below)
└── README.md
```

## 🚀 Run Locally

No build tools needed. Clone the repo and serve the folder with any static server:

```bash
git clone https://github.com/AarushOberoi/Throne-of-Ranks.git
cd Throne-of-Ranks

# Option 1: Python
python -m http.server 8000

# Option 2: Node
npx serve .
```

Then open `http://localhost:8000`.

## ⚙️ Make It Your Own

The journey is built around one exam date and a fixed start date. To adapt it for a different exam or schedule, update the exam date, start date and daily quests in the scripts under `js/`, then redeploy.

## ☁️ Deployment

Deployed as static assets on **Cloudflare Workers**:

```bash
npx wrangler deploy
```

## 🛠️ Built With

- HTML / CSS / JavaScript
- Cloudflare Workers (hosting)

## 🤝 Contributing

Ideas, bug reports and pull requests are welcome:

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes and open a pull request

## 👤 Author

Made by [Aarush Oberoi](https://github.com/AarushOberoi)
