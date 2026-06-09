"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ChartBar, 
  Play, 
  ArrowClockwise, 
  Lightning, 
  Shield, 
  SoccerBall, 
  Trophy, 
  Users 
} from "@phosphor-icons/react";
import { type Match } from "@/lib/worldcup";
import { 
  getMatchPrediction, 
  generateMatchEvents, 
  type MatchEvent, 
  type TeamStats 
} from "@/lib/prediction";

type Props = {
  match: Match;
};

export function MatchInteractiveCenter({ match }: Props) {
  const [activeTab, setActiveTab] = useState<"prediction" | "live">("prediction");
  
  // Simulator states
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [simMinute, setSimMinute] = useState(0);
  const [simEvents, setSimEvents] = useState<MatchEvent[]>([]);
  const [simScore, setSimScore] = useState<[number, number]>([0, 0]);
  const [simulationSpeed, setSimulationSpeed] = useState(150); // ms per minute
  
  // Predictions data
  const prediction = getMatchPrediction(match);
  const allEvents = generateMatchEvents(match);
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventLogEndRef = useRef<HTMLDivElement | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Scroll to bottom of event logs when new events are added
  useEffect(() => {
    if (eventLogEndRef.current) {
      eventLogEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [simEvents]);

  // Logic to handle simulated live stats based on current minute
  const getLiveStats = (): { home: TeamStats; away: TeamStats } => {
    if (!isSimulating && !isFinished) {
      return {
        home: { possession: 50, shots: 0, shotsOnTarget: 0, corners: 0, yellowCards: 0, redCards: 0 },
        away: { possession: 50, shots: 0, shotsOnTarget: 0, corners: 0, yellowCards: 0, redCards: 0 }
      };
    }

    const ratio = Math.min(1, simMinute / 90);
    const expected = prediction.expectedStats;

    // Add slight fluctuation to possession
    const possessionWave = Math.round(Math.sin(simMinute / 4) * 4);
    const homePoss = Math.max(20, Math.min(80, expected.home.possession + possessionWave));
    const awayPoss = 100 - homePoss;

    // Interpolate count of stats
    const homeShots = Math.round(expected.home.shots * ratio);
    const awayShots = Math.round(expected.away.shots * ratio);

    const homeShotsOnTarget = Math.round(expected.home.shotsOnTarget * ratio);
    const awayShotsOnTarget = Math.round(expected.away.shotsOnTarget * ratio);

    const homeCorners = Math.round(expected.home.corners * ratio);
    const awayCorners = Math.round(expected.away.corners * ratio);

    // Count cards from events occurred up to simMinute
    const homeYellows = simEvents.filter(e => e.team === "home" && e.type === "yellow_card").length;
    const awayYellows = simEvents.filter(e => e.team === "away" && e.type === "yellow_card").length;
    const homeReds = simEvents.filter(e => e.team === "home" && e.type === "red_card").length;
    const awayReds = simEvents.filter(e => e.team === "away" && e.type === "red_card").length;

    return {
      home: { possession: homePoss, shots: homeShots, shotsOnTarget: homeShotsOnTarget, corners: homeCorners, yellowCards: homeYellows, redCards: homeReds },
      away: { possession: awayPoss, shots: awayShots, shotsOnTarget: awayShotsOnTarget, corners: awayCorners, yellowCards: awayYellows, redCards: awayReds }
    };
  };

  const liveStats = getLiveStats();

  const startSimulation = () => {
    // Reset simulation
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setIsSimulating(true);
    setIsFinished(false);
    setSimMinute(0);
    setSimEvents([]);
    setSimScore([0, 0]);

    let currentMin = 0;

    intervalRef.current = setInterval(() => {
      currentMin += 1;
      setSimMinute(currentMin);

      // Filter events up to current minute
      const triggeredEvents = allEvents.filter(e => e.minute <= currentMin);
      setSimEvents(triggeredEvents);

      // Check for goals to update score
      const goals = triggeredEvents.filter(e => e.type === "goal");
      const homeScore = goals.filter(e => e.team === "home").length;
      const awayScore = goals.filter(e => e.team === "away").length;
      setSimScore([homeScore, awayScore]);

      if (currentMin >= 90) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsSimulating(false);
        setIsFinished(true);
      }
    }, simulationSpeed);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "goal":
        return <SoccerBall className="w-5 h-5 text-emerald-600 animate-bounce" weight="fill" />;
      case "yellow_card":
        return <div className="w-3.5 h-5 bg-amber-400 rounded-sm shadow-sm border border-amber-500" title="Thẻ vàng" />;
      case "red_card":
        return <div className="w-3.5 h-5 bg-red-600 rounded-sm shadow-sm border border-red-700 animate-pulse" title="Thẻ đỏ" />;
      case "corner":
        return <span className="text-sky-500 font-bold text-xs">🚩</span>;
      default:
        return <span className="text-zinc-400 text-xs">⚡</span>;
    }
  };

  return (
    <div className="mt-8 border border-zinc-200/80 rounded-2xl bg-white/50 backdrop-blur-sm overflow-hidden shadow-md">
      {/* Tabs Header */}
      <div className="flex border-b border-zinc-200 bg-zinc-50/50">
        <button
          onClick={() => setActiveTab("prediction")}
          className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 border-b-2 ${
            activeTab === "prediction"
              ? "border-[var(--fire)] text-[var(--fire)] bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
          }`}
        >
          <ChartBar size={18} weight={activeTab === "prediction" ? "fill" : "regular"} />
          Phân tích & Dự đoán
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 border-b-2 ${
            activeTab === "live"
              ? "border-[var(--fire)] text-[var(--fire)] bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
          }`}
        >
          <Lightning size={18} weight={activeTab === "live" ? "fill" : "regular"} />
          Trung tâm Live Sim
          {(isSimulating) && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fire)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--fire)]"></span>
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {activeTab === "prediction" && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
            {/* Probability Bar */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Trophy size={14} /> Xác suất mô hình (H · D · A)
              </h3>
              <div className="h-6 rounded-full overflow-hidden flex text-white font-bold text-xs shadow-inner">
                <div 
                  style={{ width: `${prediction.probabilities.home}%` }}
                  className="bg-[var(--fire)] flex items-center justify-center transition-all duration-500"
                  title={`Thắng chủ nhà (${match.homeTeam}): ${prediction.probabilities.home}%`}
                >
                  {prediction.probabilities.home > 20 && `${prediction.probabilities.home}%`}
                </div>
                <div 
                  style={{ width: `${prediction.probabilities.draw}%` }}
                  className="bg-zinc-400 flex items-center justify-center transition-all duration-500"
                  title={`Hòa: ${prediction.probabilities.draw}%`}
                >
                  {prediction.probabilities.draw > 15 && `${prediction.probabilities.draw}%`}
                </div>
                <div 
                  style={{ width: `${prediction.probabilities.away}%` }}
                  className="bg-[var(--night)] flex items-center justify-center transition-all duration-500"
                  title={`Thắng khách (${match.awayTeam}): ${prediction.probabilities.away}%`}
                >
                  {prediction.probabilities.away > 20 && `${prediction.probabilities.away}%`}
                </div>
              </div>
              <div className="flex justify-between text-xs font-semibold mt-2 text-zinc-600 px-1">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--fire)]"></span>{match.homeTeam}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>Hòa</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--night)]"></span>{match.awayTeam}</span>
              </div>
            </div>

            {/* Expected score & xG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/50">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tỉ số khả thi nhất</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-[var(--fire-dark)] data">{prediction.topScorelines[0].score}</span>
                  <span className="text-sm font-semibold text-zinc-500">({prediction.topScorelines[0].probability}% xác suất)</span>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Dựa trên mô hình Poisson và phong độ gần đây của hai đội.</p>
              </div>

              <div className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/50">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bàn thắng kỳ vọng (xG)</span>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold data">{prediction.expectedGoals.home}</div>
                    <span className="text-xs text-zinc-500">{match.homeTeam}</span>
                  </div>
                  <div className="text-zinc-300 font-bold px-4">VS</div>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold data">{prediction.expectedGoals.away}</div>
                    <span className="text-xs text-zinc-500">{match.awayTeam}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expected Stats Comparison */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ChartBar size={14} /> Thống kê dự kiến trước trận
              </h3>
              
              <div className="space-y-4">
                {/* Possession */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1">
                    <span>{prediction.expectedStats.home.possession}%</span>
                    <span className="text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">Kiểm soát bóng</span>
                    <span>{prediction.expectedStats.away.possession}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 overflow-hidden flex">
                    <div style={{ width: `${prediction.expectedStats.home.possession}%` }} className="bg-[var(--fire)]"></div>
                    <div style={{ width: `${prediction.expectedStats.away.possession}%` }} className="bg-[var(--night)]"></div>
                  </div>
                </div>

                {/* Shots */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1">
                    <span>{prediction.expectedStats.home.shots}</span>
                    <span className="text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">Tổng cú sút</span>
                    <span>{prediction.expectedStats.away.shots}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 overflow-hidden flex">
                    <div 
                      style={{ width: `${(prediction.expectedStats.home.shots / (prediction.expectedStats.home.shots + prediction.expectedStats.away.shots)) * 100}%` }} 
                      className="bg-[var(--fire)]"
                    ></div>
                    <div 
                      style={{ width: `${(prediction.expectedStats.away.shots / (prediction.expectedStats.home.shots + prediction.expectedStats.away.shots)) * 100}%` }} 
                      className="bg-[var(--night)]"
                    ></div>
                  </div>
                </div>

                {/* Shots on Target */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1">
                    <span>{prediction.expectedStats.home.shotsOnTarget}</span>
                    <span className="text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">Sút trúng đích</span>
                    <span>{prediction.expectedStats.away.shotsOnTarget}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 overflow-hidden flex">
                    <div 
                      style={{ width: `${(prediction.expectedStats.home.shotsOnTarget / (prediction.expectedStats.home.shotsOnTarget + prediction.expectedStats.away.shotsOnTarget)) * 100}%` }} 
                      className="bg-[var(--fire)]"
                    ></div>
                    <div 
                      style={{ width: `${(prediction.expectedStats.away.shotsOnTarget / (prediction.expectedStats.home.shotsOnTarget + prediction.expectedStats.away.shotsOnTarget)) * 100}%` }} 
                      className="bg-[var(--night)]"
                    ></div>
                  </div>
                </div>

                {/* Corners */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1">
                    <span>{prediction.expectedStats.home.corners}</span>
                    <span className="text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">Quả phạt góc</span>
                    <span>{prediction.expectedStats.away.corners}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 overflow-hidden flex">
                    <div 
                      style={{ width: `${(prediction.expectedStats.home.corners / (prediction.expectedStats.home.corners + prediction.expectedStats.away.corners)) * 100}%` }} 
                      className="bg-[var(--fire)]"
                    ></div>
                    <div 
                      style={{ width: `${(prediction.expectedStats.away.corners / (prediction.expectedStats.home.corners + prediction.expectedStats.away.corners)) * 100}%` }} 
                      className="bg-[var(--night)]"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Brief */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users size={14} /> Góc nhìn chiến thuật
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-l-4 border-[var(--fire)] bg-[var(--fire)]/5 p-4 rounded-r-xl">
                  <span className="text-xs font-bold text-[var(--fire-dark)] uppercase tracking-wider">{match.homeTeam}</span>
                  <p className="text-sm text-zinc-700 mt-1.5 leading-relaxed">{prediction.tacticalBriefing.home}</p>
                </div>
                <div className="border-l-4 border-[var(--night)] bg-[var(--night)]/5 p-4 rounded-r-xl">
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{match.awayTeam}</span>
                  <p className="text-sm text-zinc-700 mt-1.5 leading-relaxed">{prediction.tacticalBriefing.away}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "live" && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Live Center Scoreboard */}
            <div className="bg-zinc-900 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
              {/* Background gradient / decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--fire)] opacity-10 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-2 mb-2">
                {isSimulating && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse uppercase tracking-widest shadow">
                    ● Live
                  </span>
                )}
                {isFinished && (
                  <span className="bg-zinc-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-widest">
                    Đã kết thúc
                  </span>
                )}
                {!isSimulating && !isFinished && (
                  <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-widest">
                    Chờ khởi tạo
                  </span>
                )}
                {(isSimulating || isFinished) && (
                  <span className="text-xs font-bold text-zinc-400 data">{simMinute}&apos;</span>
                )}
              </div>

              {/* Score Display */}
              <div className="flex items-center gap-6 md:gap-12 mt-2 w-full justify-center">
                <div className="text-right flex-1 min-w-0">
                  <h4 className="font-extrabold text-base md:text-xl truncate text-zinc-100">{match.homeTeam}</h4>
                </div>

                <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-xl border border-white/5 font-mono text-3xl md:text-5xl font-black text-[var(--signal)] tracking-widest">
                  <span>{simScore[0]}</span>
                  <span className="text-white/20 text-xl font-normal">:</span>
                  <span>{simScore[1]}</span>
                </div>

                <div className="text-left flex-1 min-w-0">
                  <h4 className="font-extrabold text-base md:text-xl truncate text-zinc-100">{match.awayTeam}</h4>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-6 overflow-hidden">
                <div 
                  className="bg-[var(--fire)] h-full transition-all duration-300"
                  style={{ width: `${(simMinute / 90) * 100}%` }}
                ></div>
              </div>
              
              {/* Simulation control bar */}
              <div className="flex flex-wrap items-center gap-4 justify-between w-full mt-6 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={startSimulation}
                    disabled={isSimulating}
                    className="button-primary !min-height-[2.4rem] py-1.5 px-4 text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isFinished ? (
                      <>
                        <ArrowClockwise weight="bold" /> Giả lập lại
                      </>
                    ) : (
                      <>
                        <Play weight="fill" /> {isSimulating ? "Đang giả lập..." : "Bắt đầu Giả lập Live ⚡"}
                      </>
                    )}
                  </button>
                  {isSimulating && (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-0.5">
                      <button 
                        onClick={() => setSimulationSpeed(300)} 
                        className={`text-[9px] font-bold px-2 py-1 rounded-full ${simulationSpeed === 300 ? "bg-[var(--fire)] text-white" : "text-zinc-400"}`}
                      >
                        1x
                      </button>
                      <button 
                        onClick={() => setSimulationSpeed(150)} 
                        className={`text-[9px] font-bold px-2 py-1 rounded-full ${simulationSpeed === 150 ? "bg-[var(--fire)] text-white" : "text-zinc-400"}`}
                      >
                        2x
                      </button>
                      <button 
                        onClick={() => setSimulationSpeed(50)} 
                        className={`text-[9px] font-bold px-2 py-1 rounded-full ${simulationSpeed === 50 ? "bg-[var(--fire)] text-white" : "text-zinc-400"}`}
                      >
                        4x
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-zinc-500 text-[10px] font-bold flex items-center gap-1">
                  <Shield size={12} /> Dữ liệu mang tính chất giải trí, mô phỏng tất định.
                </div>
              </div>
            </div>

            {/* Statistics in real-time */}
            {(isSimulating || isFinished) && (
              <div className="border border-zinc-200/80 rounded-xl p-4 bg-white/80 space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Thống kê diễn biến thực tế</h4>
                
                {/* Live Possession */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
                    <span>{liveStats.home.possession}%</span>
                    <span className="text-zinc-400 text-[10px]">Kiểm soát bóng</span>
                    <span>{liveStats.away.possession}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden flex">
                    <div style={{ width: `${liveStats.home.possession}%` }} className="bg-[var(--fire)] transition-all duration-300"></div>
                    <div style={{ width: `${liveStats.away.possession}%` }} className="bg-[var(--night)] transition-all duration-300"></div>
                  </div>
                </div>

                {/* Live Shots */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
                    <span>{liveStats.home.shots} ({liveStats.home.shotsOnTarget})</span>
                    <span className="text-zinc-400 text-[10px]">Cú sút (trúng đích)</span>
                    <span>{liveStats.away.shots} ({liveStats.away.shotsOnTarget})</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden flex">
                    <div 
                      style={{ width: `${(liveStats.home.shots / Math.max(1, liveStats.home.shots + liveStats.away.shots)) * 100}%` }} 
                      className="bg-[var(--fire)] transition-all duration-300"
                    ></div>
                    <div 
                      style={{ width: `${(liveStats.away.shots / Math.max(1, liveStats.home.shots + liveStats.away.shots)) * 100}%` }} 
                      className="bg-[var(--night)] transition-all duration-300"
                    ></div>
                  </div>
                </div>

                {/* Live Corners & Cards */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs border-t border-zinc-100">
                  <div>
                    <div className="font-bold text-zinc-700">{liveStats.home.corners} - {liveStats.away.corners}</div>
                    <div className="text-[10px] text-zinc-400">Phạt góc</div>
                  </div>
                  <div>
                    <div className="font-bold text-zinc-700 flex items-center justify-center gap-1">
                      <span className="w-2.5 h-3.5 bg-amber-400 border border-amber-500 rounded-sm inline-block"></span>
                      <span>{liveStats.home.yellowCards} - {liveStats.away.yellowCards}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Thẻ vàng</div>
                  </div>
                  <div>
                    <div className="font-bold text-zinc-700 flex items-center justify-center gap-1">
                      <span className="w-2.5 h-3.5 bg-red-600 border border-red-700 rounded-sm inline-block"></span>
                      <span>{liveStats.home.redCards} - {liveStats.away.redCards}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Thẻ đỏ</div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Event logs */}
            {(isSimulating || isFinished) && (
              <div className="border border-zinc-200/80 rounded-xl p-4 bg-zinc-50/50">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Dòng diễn biến sự kiện</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 select-none flex flex-col">
                  {simEvents.length === 0 ? (
                    <div className="text-center text-zinc-400 text-xs py-8">
                      Trận đấu chưa có diễn biến đặc biệt...
                    </div>
                  ) : (
                    simEvents.map((evt, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-3 items-start p-2.5 rounded-lg border text-xs bg-white shadow-sm transition-all duration-300 animate-[fadeInUp_0.25s_ease-out] ${
                          evt.type === "goal" 
                            ? "border-emerald-200 bg-emerald-50/20" 
                            : evt.type === "red_card" 
                              ? "border-red-200 bg-red-50/20" 
                              : "border-zinc-100"
                        }`}
                      >
                        <div className="font-bold text-zinc-500 w-8 flex-shrink-0 text-right data">{evt.minute}&apos;</div>
                        <div className="flex-shrink-0">{getEventIcon(evt.type)}</div>
                        <div className="flex-1 text-zinc-800">
                          <p className="font-semibold mb-0.5">
                            {evt.type === "goal" && "VÀO MỘT TRẬN ĐẤU ĐỈNH CAO! "}
                            {evt.type === "yellow_card" && "THẺ VÀNG! "}
                            {evt.type === "red_card" && "THẺ ĐỎ! "}
                          </p>
                          <p className="leading-relaxed">{evt.detail}</p>
                        </div>
                        {evt.type === "goal" && (
                          <div className="font-mono font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                            {evt.score[0]} - {evt.score[1]}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={eventLogEndRef} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
