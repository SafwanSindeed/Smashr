export const MOCK_TOURNAMENTS = [
  {
    id: "t1",
    name: "Spring Open Singles",
    format: "S",
    startDate: "2026-06-14",
    endDate: "2026-06-15",
    city: "Toronto",
    country: "Canada",
    levelRange: "3.0–4.5",
    startLevel: 3.0,
    endLevel: 4.5,
    fee: 45,
    maxPlayers: 64,
    totalPlayers: 38,
    description:
      "Kick off the summer season with Toronto's premier singles tournament for intermediate to advanced players. Compete on professional courts with referees and live scoring.",
  },
  {
    id: "t2",
    name: "Doubles Showdown",
    format: "D",
    startDate: "2026-06-21",
    endDate: "2026-06-22",
    city: "Mississauga",
    country: "Canada",
    levelRange: "2.5–4.0",
    startLevel: 2.5,
    endLevel: 4.0,
    fee: 60,
    maxPlayers: 32,
    totalPlayers: 18,
    description:
      "Partner up and battle it out in this exciting doubles format open to recreational and club-level players. Entry fee covers both players and includes post-tournament social.",
  },
  {
    id: "t3",
    name: "Summer Series Pro",
    format: "S",
    startDate: "2026-07-05",
    endDate: "2026-07-06",
    city: "Ottawa",
    country: "Canada",
    levelRange: "4.0–5.0",
    startLevel: 4.0,
    endLevel: 5.0,
    fee: 55,
    maxPlayers: 48,
    totalPlayers: 41,
    description:
      "An elite singles event designed for high-level competitors looking to test their skills against the best in the region. Round-robin pool play followed by single-elimination brackets.",
  },
  {
    id: "t4",
    name: "Mixed Open League",
    format: "D",
    startDate: "2026-07-12",
    endDate: "2026-07-12",
    city: "Brampton",
    country: "Canada",
    levelRange: "2.5–3.5",
    startLevel: 2.5,
    endLevel: 3.5,
    fee: 40,
    maxPlayers: 40,
    totalPlayers: 22,
    description:
      "A one-day mixed doubles league event welcoming beginner to intermediate teams in a fun, social atmosphere. All matches are guaranteed regardless of round-robin results.",
  },
  {
    id: "t5",
    name: "Smash & Rally Cup",
    format: "S",
    startDate: "2026-08-02",
    endDate: "2026-08-03",
    city: "Hamilton",
    country: "Canada",
    levelRange: "3.5–5.0",
    startLevel: 3.5,
    endLevel: 5.0,
    fee: 50,
    maxPlayers: 56,
    totalPlayers: 29,
    description:
      "Hamilton's signature annual pickleball cup draws competitors from across Ontario for two days of intense singles play. Cash prizes awarded to top finishers in each skill bracket.",
  },
];

export function getMockSessions() {
  const now = new Date();
  const dayStart = (daysFromToday, hour, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromToday);
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  };

  const sessions = [];

  // Beginner Bootcamp — days 0, 2, 4 at 9am-10:30am
  [0, 2, 4].forEach((day, i) => {
    sessions.push({
      _id: `bb_${day}`,
      name: "Beginner Bootcamp",
      category: "clinics",
      level: "Beginner",
      levelColor: "#10B981",
      instructor: "Coach Sarah M.",
      location: "Smashr Court Centre",
      city: "Toronto",
      price: 25,
      spots: 12,
      maxSpots: 16,
      description:
        "A structured clinic covering the fundamentals of pickleball including dinking, serving, and court positioning. Perfect for players new to the sport looking to build a solid foundation.",
      start_time: dayStart(day, 9),
      end_time: dayStart(day, 10, 30),
    });
  });

  // Advanced Drills & Strategy — days 1, 3 at 7pm-8:30pm
  [1, 3].forEach((day) => {
    sessions.push({
      _id: `ad_${day}`,
      name: "Advanced Drills & Strategy",
      category: "clinics",
      level: "Advanced",
      levelColor: "#EF4444",
      instructor: "Coach Marcus T.",
      location: "Smashr Court Centre",
      city: "Toronto",
      price: 30,
      spots: 8,
      maxSpots: 12,
      description:
        "High-intensity drills focused on third-shot drops, speed-up attacks, and transition zone strategy for competitive players. Video analysis and personalized feedback included.",
      start_time: dayStart(day, 19),
      end_time: dayStart(day, 20, 30),
    });
  });

  // Open Play — days 0-6 at 6pm-8pm
  [0, 1, 2, 3, 4, 5, 6].forEach((day) => {
    sessions.push({
      _id: `op_${day}`,
      name: "Open Play",
      category: "open-play",
      level: "Intermediate",
      levelColor: "#F59E0B",
      instructor: null,
      location: "Smashr Park Courts",
      city: "Toronto",
      price: 0,
      spots: 20,
      maxSpots: 30,
      description:
        "Drop-in open play for intermediate players. Courts are reserved exclusively for Smashr members and guests. Rally format with rotating partners keeps games moving.",
      start_time: dayStart(day, 18),
      end_time: dayStart(day, 20),
    });
  });

  // Youth Fundamentals — days 5, 6 at 10am-12pm
  [5, 6].forEach((day) => {
    sessions.push({
      _id: `yf_${day}`,
      name: "Youth Fundamentals",
      category: "clinics",
      level: "Beginner",
      levelColor: "#10B981",
      instructor: "Coach Ali K.",
      location: "Community Recreation Centre",
      city: "Toronto",
      price: 20,
      spots: 9,
      maxSpots: 14,
      description:
        "A two-hour youth clinic designed for players aged 10–17 covering basic skills, game rules, and sportsmanship. Equipment provided for all participants.",
      start_time: dayStart(day, 10),
      end_time: dayStart(day, 12),
    });
  });

  // Competitive League Night — day 2 at 7pm-9pm
  sessions.push({
    _id: "cln_2",
    name: "Competitive League Night",
    category: "leagues",
    level: "Advanced",
    levelColor: "#EF4444",
    instructor: null,
    location: "Smashr Court Centre",
    city: "Toronto",
    price: 15,
    spots: 16,
    maxSpots: 20,
    description:
      "Weekly competitive league night featuring round-robin matches tracked in the Smashr leaderboard. Rankings updated in real time — climb the board and earn season prizes.",
    start_time: dayStart(2, 19),
    end_time: dayStart(2, 21),
  });

  sessions.sort((a, b) => a.start_time - b.start_time);
  return sessions;
}
