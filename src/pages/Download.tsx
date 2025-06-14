
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { useToast } from '@/hooks/use-toast';

const Download = () => {
  const { players, squads, formations, dues } = useFantacalcietto();
  const { toast } = useToast();

  const downloadCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(/\s+/g, '')];
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Complete! 📥",
      description: `${filename}.csv has been downloaded`,
    });
  };

  const downloadPlayersData = () => {
    const headers = ['Name', 'Position', 'Goals', 'Assists', 'Saves', 'DefenderVoting'];
    const data = players.map(player => ({
      name: player.name,
      position: player.position,
      goals: player.goals,
      assists: player.assists,
      saves: player.saves,
      defendervoting: player.defenderVoting,
    }));
    downloadCSV(data, 'players_data', headers);
  };

  const downloadSquadsData = () => {
    const headers = ['Squad Name', 'Mode', 'Players', 'Created At'];
    const data = squads.map(squad => ({
      squadname: squad.name,
      mode: squad.mode,
      players: squad.players.map(p => p.name).join('; '),
      createdat: squad.createdAt.toISOString().split('T')[0],
    }));
    downloadCSV(data, 'squads_data', headers);
  };

  const downloadFormationsData = () => {
    const headers = ['Formation Name', 'Mode', 'Team A', 'Team B', 'Created At'];
    const data = formations.map(formation => ({
      formationname: formation.name,
      mode: formation.mode,
      teama: formation.teamA.map(p => p.name).join('; '),
      teamb: formation.teamB.map(p => p.name).join('; '),
      createdat: formation.createdAt.toISOString().split('T')[0],
    }));
    downloadCSV(data, 'formations_data', headers);
  };

  const downloadDuesData = () => {
    const headers = ['Player Name', 'Amount', 'Description', 'Paid', 'Date'];
    const data = dues.map(due => ({
      playername: due.playerName,
      amount: due.amount,
      description: due.description,
      paid: due.paid ? 'Yes' : 'No',
      date: due.date.toISOString().split('T')[0],
    }));
    downloadCSV(data, 'dues_data', headers);
  };

  const downloadAllData = () => {
    downloadPlayersData();
    setTimeout(() => downloadSquadsData(), 500);
    setTimeout(() => downloadFormationsData(), 1000);
    setTimeout(() => downloadDuesData(), 1500);
  };

  const downloadOptions = [
    {
      title: 'Players Data 👥',
      description: 'Download all player statistics and rankings',
      count: players.length,
      action: downloadPlayersData,
      icon: '👥',
    },
    {
      title: 'Squads Data ⚽',
      description: 'Download generated squads and team compositions',
      count: squads.length,
      action: downloadSquadsData,
      icon: '⚽',
    },
    {
      title: 'Formations Data 🏗️',
      description: 'Download match formations and setups',
      count: formations.length,
      action: downloadFormationsData,
      icon: '🏗️',
    },
    {
      title: 'Dues Data 💰',
      description: 'Download payment tracking and dues information',
      count: dues.length,
      action: downloadDuesData,
      icon: '💰',
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#333446]">Download Data 📥</h1>
        <p className="text-[#7F8CAA]">Export your FantaCalcetto data in CSV format</p>
      </div>

      {/* Download All */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#333446]">
            📦 Download All Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <p className="text-[#7F8CAA]">
                Download all your data including players, squads, formations, and dues in separate CSV files.
              </p>
            </div>
            <Button 
              onClick={downloadAllData}
              className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
            >
              Download All 📦
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Downloads */}
      <div className="grid md:grid-cols-2 gap-6">
        {downloadOptions.map((option, index) => (
          <Card key={index} className="bg-white border-[#B8CFCE]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#333446]">
                <span className="text-2xl">{option.icon}</span>
                {option.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[#7F8CAA]">{option.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#7F8CAA]">Records:</span>
                  <span className="font-bold text-[#333446]">{option.count}</span>
                </div>
                <Button 
                  onClick={option.action}
                  variant="outline"
                  className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
                  disabled={option.count === 0}
                >
                  Download CSV 📄
                </Button>
              </div>

              {option.count === 0 && (
                <p className="text-sm text-[#7F8CAA] italic">
                  No data available for download
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Summary */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Data Summary 📊</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-[#EAEFEF]">
              <div className="text-2xl font-bold text-[#333446]">{players.length}</div>
              <div className="text-sm text-[#7F8CAA]">Players</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#EAEFEF]">
              <div className="text-2xl font-bold text-[#333446]">{squads.length}</div>
              <div className="text-sm text-[#7F8CAA]">Squads</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#EAEFEF]">
              <div className="text-2xl font-bold text-[#333446]">{formations.length}</div>
              <div className="text-sm text-[#7F8CAA]">Formations</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#EAEFEF]">
              <div className="text-2xl font-bold text-[#333446]">{dues.length}</div>
              <div className="text-sm text-[#7F8CAA]">Dues</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Download;
