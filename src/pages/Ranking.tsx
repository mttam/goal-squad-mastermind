
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { getRankedPlayers } from '@/utils/rankings';
import { RankingType } from '@/types/fantacalcietto';

const Ranking = () => {
  const { players } = useFantacalcietto();
  const [activeRanking, setActiveRanking] = useState<RankingType>('goleador');

  const rankings = {
    goleador: { title: 'Goleador 🥅', icon: '⚽', stat: 'goals' },
    assistman: { title: 'Assistman 🤝', icon: '🎯', stat: 'assists' },
    bestnonGK: { title: 'Best Non-GK 🛡️', icon: '🥇', stat: 'saves' },
    bestDefender: { title: 'Best Defender 🗳️', icon: '🛡️', stat: 'defenderVoting' },
  };

  const rankedPlayers = getRankedPlayers(players, activeRanking);

  const getPositionEmoji = (position: string) => {
    switch (position) {
      case 'GK': return '🥅';
      case 'DEF': return '🛡️';
      case 'MID': return '⚙️';
      case 'ATT': return '⚔️';
      default: return '⚽';
    }
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}°`;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#333446]">Rankings 🏆</h1>
        <p className="text-[#7F8CAA]">Check out the best players in different categories</p>
      </div>

      {/* Ranking Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(rankings).map(([key, ranking]) => (
          <Button
            key={key}
            variant={activeRanking === key ? "default" : "outline"}
            onClick={() => setActiveRanking(key as RankingType)}
            className={`p-4 h-auto flex flex-col gap-2 ${
              activeRanking === key 
                ? 'bg-[#333446] text-white' 
                : 'text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]'
            }`}
          >
            <span className="text-2xl">{ranking.icon}</span>
            <span className="text-sm font-medium">{ranking.title}</span>
          </Button>
        ))}
      </div>

      {/* Ranking Table */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#333446]">
            <span className="text-2xl">{rankings[activeRanking].icon}</span>
            {rankings[activeRanking].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#333446]">Position</TableHead>
                <TableHead className="text-[#333446]">Player</TableHead>
                <TableHead className="text-[#333446]">Role</TableHead>
                <TableHead className="text-[#333446]">Value</TableHead>
                <TableHead className="text-[#333446]">Goals</TableHead>
                <TableHead className="text-[#333446]">Assists</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedPlayers.slice(0, 20).map((player, index) => (
                <TableRow 
                  key={player.id}
                  className={index < 3 ? 'bg-[#EAEFEF]' : ''}
                >
                  <TableCell className="font-medium">
                    {getRankEmoji(index)}
                  </TableCell>
                  <TableCell className="font-medium text-[#333446]">
                    {player.name}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {getPositionEmoji(player.position)}
                      {player.position}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-[#333446]">
                    {player[rankings[activeRanking].stat as keyof typeof player]}
                  </TableCell>
                  <TableCell className="text-[#7F8CAA]">{player.goals}</TableCell>
                  <TableCell className="text-[#7F8CAA]">{player.assists}</TableCell>
                </TableRow>
              ))}
            </TableBody>          </Table>
        </CardContent>
      </Card>

      {/* References Footer */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-[#333446]">Powered by</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a 
                href="https://github.com/mttam" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#7F8CAA] hover:text-[#333446] transition-colors"
              >
                <span>👨‍💻</span>
                <span>@mttam</span>
              </a>
              <span className="hidden sm:block text-[#B8CFCE]">•</span>
              <a 
                href="https://lovable.dev/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#7F8CAA] hover:text-[#333446] transition-colors"
              >
                <span>💖</span>
                <span>Lovable</span>
              </a>
              <span className="hidden sm:block text-[#B8CFCE]">•</span>
              <a 
                href="https://github.com/features/copilot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#7F8CAA] hover:text-[#333446] transition-colors"
              >
                <span>🤖</span>
                <span>GitHub Copilot</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ranking;
