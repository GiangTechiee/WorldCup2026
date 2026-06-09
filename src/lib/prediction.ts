import { type Match } from "./worldcup";

// Trình tạo số ngẫu nhiên có hạt giống (Seeded PRNG) để đảm bảo kết quả tất định
export function createSeededRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export type MatchPrediction = {
  probabilities: {
    home: number;
    draw: number;
    away: number;
  };
  expectedGoals: {
    home: number;
    away: number;
  };
  topScorelines: {
    score: string;
    probability: number;
  }[];
  expectedStats: {
    home: TeamStats;
    away: TeamStats;
  };
  tacticalBriefing: {
    home: string;
    away: string;
  };
};

export type TeamStats = {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  yellowCards: number;
  redCards: number;
};

export type MatchEvent = {
  minute: number;
  type: "goal" | "yellow_card" | "red_card" | "corner" | "shot" | "sub";
  team: "home" | "away";
  detail: string;
  score: [number, number]; // [homeScore, awayScore] tại thời điểm sự kiện xảy ra
};

// Hàm nhận định chiến thuật giả lập hài hước và trực quan
const tacticalBriefs = {
  home: [
    "Dự kiến chơi pressing tầm cao, cố gắng kiểm soát thế trận khu trung tuyến bằng các đường chuyền ngắn.",
    "Lối đá phòng ngự phản công chớp nhoáng, tận dụng tối đa tốc độ của hai biên để kéo giãn đội hình đối thủ.",
    "Tập trung vào kiểm soát bóng chủ động, sẵn sàng đá chậm và kéo dài thời gian để ru ngủ đối thủ trước khi tăng tốc.",
    "Chơi bóng dài và tận dụng các tình huống cố định cũng như tranh chấp bóng bổng trong vòng cấm.",
  ],
  away: [
    "Chủ trương phòng ngự lùi sâu chặt chẽ, dựng xe buýt hai tầng và chờ đợi sai lầm từ đối phương.",
    "Tấn công trung lộ bằng lối đá đập nhả nhanh (tiki-taka biến thể), đẩy cao cường độ tranh chấp bóng hai.",
    "Tận dụng các pha phản công tốc độ cao, hạn chế rủi ro ở phần sân nhà và triển khai bóng trực diện.",
    "Thiết lập bẫy việt vị tầm cao, chủ động bóp nghẹt không gian chơi bóng của đối thủ ngay từ vạch giữa sân.",
  ],
};

const playersMock: Record<string, string[]> = {
  Mexico: ["Giménez", "Lozano", "Álvarez", "Chávez", "Sánchez", "Martin", "Montes", "Ochoa"],
  "South Africa": ["Tau", "Foster", "Mokoena", "Zwane", "Modiba", "Xulu", "Williams", "Lepasa"],
  "South Korea": ["Son Heung-min", "Hwang Hee-chan", "Lee Kang-in", "Kim Min-jae", "Hwang In-beom", "Cho Gue-sung"],
  "Czech Republic": ["Schick", "Souček", "Hložek", "Barák", "Coufal", "Provod", "Staněk", "Chytil"],
  Canada: ["David", "Davies", "Buchanan", "Eustáquio", "Larin", "Kone", "Johnston", "Crépeau"],
  "Bosnia & Herzegovina": ["Džeko", "Demirović", "Kolašinac", "Krunić", "Tahirović", "Ahmedhodžić"],
  Qatar: ["Afif", "Almoez Ali", "Al-Haydos", "Hassan", "Hatem", "Pedro Miguel"],
  Switzerland: ["Embolo", "Shaqiri", "Xhaka", "Akanji", "Sommer", "Vargas", "Freuler", "Kobel"],
  Brazil: ["Vinícius Jr.", "Rodrygo", "Neymar Jr.", "Martinelli", "Guimarães", "Paquetá", "Marquinhos", "Alisson"],
  Morocco: ["Ziyech", "En-Nesyri", "Hakimi", "Amrabat", "Ounahi", "Bounou", "Diaz", "Adli"],
  Haiti: ["Pierrot", "Nazon", "Guerrier", "Placide", "Metusala", "Arcus"],
  Scotland: ["McTominay", "McGinn", "Robertson", "Adams", "Gilmour", "Tierney", "Gunn"],
  USA: ["Pulisic", "Weah", "Balogun", "McKennie", "Musah", "Adams", "Robinson", "Turner"],
  Paraguay: ["Almirón", "Sanabria", "Enciso", "Gómez", "Villasanti", "Balbuena"],
  Australia: ["Duke", "Boyle", "Goodwin", "Irvine", "Metcalfe", "Souttar", "Ryan"],
  Turkey: ["Güler", "Yılmaz", "Çalhanoğlu", "Kökçü", "Bardakcı", "Celik", "Günok"],
  Germany: ["Wirtz", "Musiala", "Havertz", "Gündoğan", "Kimmich", "Rüdiger", "Ter Stegen", "Füllkrug"],
  Curaçao: ["Bacuna", "Janga", "Gorré", "Kuwas", "Room", "Anita"],
  "Ivory Coast": ["Haller", "Adingra", "Kessié", "Fofana", "Singo", "N'Dicka", "Fofana"],
  Ecuador: ["Valencia", "Caicedo", "Estupiñán", "Hincapié", "Páez", "Porozo", "Galíndez"],
  Netherlands: ["Depay", "Gakpo", "Simons", "De Jong", "Van Dijk", "Aké", "Dumfries", "Verbruggen"],
  Japan: ["Mitoma", "Kubo", "Endo", "Minamino", "Itakura", "Tomiyasu", "Suzuki", "Maeda"],
  Sweden: ["Gyökeres", "Isak", "Kulusevski", "Forsberg", "Lindelöf", "Olsen", "Elanga"],
  Tunisia: ["Msakni", "Layouni", "Skhiri", "Laïdouni", "Talbi", "Dahmen"],
  Belgium: ["Lukaku", "De Bruyne", "Doku", "Trossard", "Tielemans", "Faes", "Casteels"],
  Egypt: ["Salah", "Marmoush", "Mostafa Mohamed", "Trezeguet", "Elneny", "Hegazi", "El Shenawy"],
  Iran: ["Taremi", "Azmoun", "Jahanbakhsh", "Ghoddos", "Rezaeian", "Beiranvand"],
  "New Zealand": ["Wood", "Singh", "Cacace", "Garbett", "Bell", "Tuiloma"],
  Spain: ["Morata", "Yamal", "Williams", "Pedri", "Rodri", "Carvajal", "Simon", "Olmo"],
  "Cape Verde": ["Bebé", "Mendes", "Cabral", "Monteiro", "Costa", "Vozinha"],
  "Saudi Arabia": ["Al-Dawsari", "Al-Shehri", "Kanno", "Al-Ghannam", "Al-Bulaihi", "Al-Owais"],
  Uruguay: ["Núñez", "Suárez", "Valverde", "Bentancur", "Araújo", "Giménez", "Rochet"],
  France: ["Mbappé", "Griezmann", "Dembélé", "Tchouaméni", "Camavinga", "Saliba", "Maignan", "Giroud"],
  Senegal: ["Mané", "Sarr", "Jackson", "Gueye", "Koulibaly", "Mendy", "Diallo"],
  Iraq: ["Ali Jasim", "Aymen Hussein", "Resan", "Bayesh", "Adnan", "Hasan"],
  Norway: ["Haaland", "Ødegaard", "Nusa", "Berge", "Ryerson", "Nyland", "Sørloth"],
  Argentina: ["Messi", "Álvarez", "Di María", "Fernández", "Mac Allister", "De Paul", "Romero", "Martínez"],
  Algeria: ["Mahrez", "Bounedjah", "Aouar", "Bentaleb", "Bensebaini", "Mandi"],
  Austria: ["Gregoritsch", "Sabitzer", "Laimer", "Baumgartner", "Posch", "Pentz", "Arnautović"],
  Jordan: ["Al-Taamari", "Al-Naimat", "Olwan", "Al-Rawabdeh", "Abu Laila"],
  Portugal: ["Ronaldo", "Fernandes", "Bernardo Silva", "Leão", "Palhinha", "Dias", "Costa", "Félix"],
  "DR Congo": ["Wissa", "Bakambu", "Moutoussamy", "Masuaku", "Mbemba", "Mpasi"],
  Uzbekistan: ["Shomurodov", "Masharipov", "Urunov", "Shukurov", "Ashurmatov", "Yusupov"],
  Colombia: ["Díaz", "James Rodríguez", "Arias", "Lerma", "Muñoz", "Vargas"],
  England: ["Kane", "Saka", "Foden", "Bellingham", "Rice", "Walker", "Pickford", "Palmer"],
  Croatia: ["Modrić", "Kramarić", "Perišić", "Kovačić", "Gvardiol", "Livaković", "Pasalić"],
  Ghana: ["Kudus", "Williams", "Ayew", "Partey", "Salisu", "Ati-Zigi"],
  Panama: ["Fajardo", "Rodríguez", "Carrasquilla", "Godoy", "Murillo", "Mejía"],
};

function getTeamPlayer(teamName: string, rand: () => number): string {
  const list = playersMock[teamName] || ["Cầu thủ số 1", "Cầu thủ số 2", "Cầu thủ số 3", "Cầu thủ số 4"];
  const index = Math.floor(rand() * list.length);
  return list[index];
}

// Lấy thông số dự đoán cho một trận đấu dựa vào ID trận đấu
export function getMatchPrediction(match: Match): MatchPrediction {
  const rand = createSeededRandom(match.id);

  // Tính toán xác suất cơ bản dựa vào mức độ quen thuộc của tên đội (giả lập Elo đơn giản)
  const homeLen = match.homeTeam.length;
  const awayLen = match.awayTeam.length;
  const rawDiff = homeLen - awayLen; // seed ngẫu nhiên nhưng logic nhất quán

  let homeProb = 35 + Math.round(rand() * 15) + rawDiff;
  let awayProb = 30 + Math.round(rand() * 15) - rawDiff;
  
  // Ràng buộc khoảng hợp lý
  homeProb = Math.max(15, Math.min(75, homeProb));
  awayProb = Math.max(15, Math.min(75, awayProb));
  const drawProb = 100 - homeProb - awayProb;

  // Tính xG trung bình
  const homeXG = Number((1.0 + rand() * 1.5 + (homeProb - awayProb) / 100).toFixed(2));
  const awayXG = Number((0.8 + rand() * 1.5 + (awayProb - homeProb) / 100).toFixed(2));

  // Tạo top scorelines
  const topScorelines = [
    { score: `${Math.round(homeXG)} - ${Math.round(awayXG)}`, probability: 12 + Math.round(rand() * 4) },
    { score: `${Math.round(homeXG) + 1} - ${Math.round(awayXG)}`, probability: 9 + Math.round(rand() * 3) },
    { score: `${Math.round(homeXG)} - ${Math.round(awayXG) + 1}`, probability: 8 + Math.round(rand() * 3) },
  ].sort((a, b) => b.probability - a.probability);

  // expected stats
  const homePossession = 45 + Math.round(rand() * 10) + Math.round((homeProb - awayProb) / 5);
  const awayPossession = 100 - homePossession;

  const expectedStats = {
    home: {
      possession: homePossession,
      shots: 8 + Math.round(rand() * 10) + Math.round((homeProb - awayProb) / 8),
      shotsOnTarget: 3 + Math.round(rand() * 5),
      corners: 3 + Math.round(rand() * 6),
      yellowCards: 1 + Math.round(rand() * 3),
      redCards: rand() > 0.92 ? 1 : 0,
    },
    away: {
      possession: awayPossession,
      shots: 7 + Math.round(rand() * 10) + Math.round((awayProb - homeProb) / 8),
      shotsOnTarget: 2 + Math.round(rand() * 5),
      corners: 3 + Math.round(rand() * 5),
      yellowCards: 1 + Math.round(rand() * 4),
      redCards: rand() > 0.95 ? 1 : 0,
    },
  };

  const briefingIdxHome = Math.floor(rand() * tacticalBriefs.home.length);
  const briefingIdxAway = Math.floor(rand() * tacticalBriefs.away.length);

  return {
    probabilities: {
      home: homeProb,
      draw: drawProb,
      away: awayProb,
    },
    expectedGoals: {
      home: homeXG,
      away: awayXG,
    },
    topScorelines,
    expectedStats,
    tacticalBriefing: {
      home: tacticalBriefs.home[briefingIdxHome],
      away: tacticalBriefs.away[briefingIdxAway],
    },
  };
}

// Sinh ra diễn biến trận đấu ngẫu nhiên một cách tất định phục vụ Live Simulator
export function generateMatchEvents(match: Match): MatchEvent[] {
  const rand = createSeededRandom(match.id + "-live");
  const pred = getMatchPrediction(match);
  
  // Xác định tỉ số cuối cùng tất định dựa trên topScorelines
  const finalScoreStr = pred.topScorelines[0].score;
  const [finalHome, finalAway] = finalScoreStr.split(" - ").map(Number);

  const events: MatchEvent[] = [];

  // 1. Phân bổ các bàn thắng (Goals)
  let currentHomeScore = 0;
  let currentAwayScore = 0;

  for (let i = 0; i < finalHome; i++) {
    const min = 5 + Math.floor(rand() * 80);
    events.push({
      minute: min,
      type: "goal",
      team: "home",
      detail: `Ghi bàn! ${getTeamPlayer(match.homeTeam, rand)} sút tung lưới đối phương sau một đường chuyền kiến tạo đẹp mắt.`,
      score: [0, 0], // sẽ cập nhật lại sau khi sắp xếp
    });
  }

  for (let i = 0; i < finalAway; i++) {
    const min = 5 + Math.floor(rand() * 80);
    events.push({
      minute: min,
      type: "goal",
      team: "away",
      detail: `Ghi bàn! ${getTeamPlayer(match.awayTeam, rand)} lập công với pha dứt điểm cận thành hiểm hóc.`,
      score: [0, 0],
    });
  }

  // 2. Thẻ phạt (Cards)
  const homeYellows = pred.expectedStats.home.yellowCards;
  for (let i = 0; i < homeYellows; i++) {
    events.push({
      minute: 10 + Math.floor(rand() * 75),
      type: "yellow_card",
      team: "home",
      detail: `Thẻ vàng! ${getTeamPlayer(match.homeTeam, rand)} phạm lỗi nguy hiểm nhằm ngăn cản pha phản công.`,
      score: [0, 0],
    });
  }

  const awayYellows = pred.expectedStats.away.yellowCards;
  for (let i = 0; i < awayYellows; i++) {
    events.push({
      minute: 10 + Math.floor(rand() * 75),
      type: "yellow_card",
      team: "away",
      detail: `Thẻ vàng! ${getTeamPlayer(match.awayTeam, rand)} nhận thẻ phạt vì hành vi cản trở thủ môn phát bóng.`,
      score: [0, 0],
    });
  }

  if (pred.expectedStats.home.redCards > 0) {
    events.push({
      minute: 60 + Math.floor(rand() * 25),
      type: "red_card",
      team: "home",
      detail: `Thẻ đỏ trực tiếp! Trọng tài truất quyền thi đấu của ${getTeamPlayer(match.homeTeam, rand)} sau pha va chạm thô bạo.`,
      score: [0, 0],
    });
  }

  if (pred.expectedStats.away.redCards > 0) {
    events.push({
      minute: 60 + Math.floor(rand() * 25),
      type: "red_card",
      team: "away",
      detail: `Thẻ đỏ trực tiếp! ${getTeamPlayer(match.awayTeam, rand)} nhận thẻ đỏ sau khi nhận xét sai lệch về quyết định của trọng tài biên.`,
      score: [0, 0],
    });
  }

  // 3. Phạt góc quan trọng / Thay người / Cú sút nguy hiểm tiêu biểu
  const totalSubEvents = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < totalSubEvents; i++) {
    const min = 15 + Math.floor(rand() * 70);
    const team = rand() > 0.5 ? "home" : "away";
    const eventType = rand() > 0.5 ? "corner" : "shot";
    const teamName = team === "home" ? match.homeTeam : match.awayTeam;
    
    if (eventType === "corner") {
      events.push({
        minute: min,
        type: "corner",
        team,
        detail: `Quả phạt góc cho ${teamName}. Hàng phòng ngự đối thủ đang tổ chức kèm người chặt chẽ.`,
        score: [0, 0],
      });
    } else {
      events.push({
        minute: min,
        type: "shot",
        team,
        detail: `Cú dứt điểm! ${getTeamPlayer(teamName, rand)} tung cú sút đầy uy lực ngoài vòng cấm khiến thủ môn phải trổ tài cản phá.`,
        score: [0, 0],
      });
    }
  }

  // Sắp xếp các sự kiện theo phút thi đấu tăng dần
  events.sort((a, b) => a.minute - b.minute);

  // Cập nhật điểm số tích lũy tại từng thời điểm ghi bàn
  events.forEach((evt) => {
    if (evt.type === "goal") {
      if (evt.team === "home") {
        currentHomeScore++;
      } else {
        currentAwayScore++;
      }
    }
    evt.score = [currentHomeScore, currentAwayScore];
  });

  return events;
}
