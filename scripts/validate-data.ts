import groupsSource from "../src/data/raw/worldcup.groups.json";
import stadiumsSource from "../src/data/raw/worldcup.stadiums.json";
import teamsSource from "../src/data/raw/worldcup.teams.json";
import tournamentSource from "../src/data/raw/worldcup.json";

const fail = (message: string): never => {
  throw new Error(message);
};

const teamNames = new Set(teamsSource.map((team) => team.name));
const teamCodes = new Set<string>();
const matchNumbers = new Set<number>();

for (const team of teamsSource) {
  if (!team.name || !team.fifa_code || !team.group || !team.flag_icon) {
    fail(`Đội thiếu dữ liệu bắt buộc: ${JSON.stringify(team)}`);
  }
  if (teamCodes.has(team.fifa_code)) fail(`Mã FIFA bị trùng: ${team.fifa_code}`);
  teamCodes.add(team.fifa_code);
}

for (const group of groupsSource.groups) {
  if (group.teams.length !== 4) fail(`${group.name} không có đúng 4 đội`);
  for (const team of group.teams) {
    if (!teamNames.has(team)) fail(`${group.name} tham chiếu đội không tồn tại: ${team}`);
  }
}

for (const [index, match] of tournamentSource.matches.entries()) {
  if (!match.date || !match.time || !match.team1 || !match.team2 || !match.ground) {
    fail(`Trận ${index + 1} thiếu dữ liệu bắt buộc`);
  }

  const time = match.time.match(/^(\d{2}:\d{2}) UTC([+-])(\d{1,2})$/);
  if (!time) {
    throw new Error(`Thời gian không hợp lệ ở trận ${index + 1}: ${match.time}`);
  }

  const [, clock, sign, hours] = time;
  const kickoff = new Date(`${match.date}T${clock}:00${sign}${hours.padStart(2, "0")}:00`);
  if (Number.isNaN(kickoff.getTime())) fail(`Ngày giờ không parse được ở trận ${index + 1}`);

  if (match.num) {
    if (matchNumbers.has(match.num)) fail(`Số trận bị trùng: ${match.num}`);
    matchNumbers.add(match.num);
  }
}

const stadiumCities = new Set(stadiumsSource.stadiums.map((stadium) => stadium.city));
for (const match of tournamentSource.matches) {
  if (!stadiumCities.has(match.ground)) fail(`Không tìm thấy sân theo thành phố: ${match.ground}`);
}

console.log("Dữ liệu World Cup hợp lệ:");
console.log(`- ${tournamentSource.matches.length} trận`);
console.log(`- ${teamsSource.length} đội`);
console.log(`- ${groupsSource.groups.length} bảng`);
console.log(`- ${stadiumsSource.stadiums.length} sân`);
