import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    desktop?: {
      getDatabaseStatus: () => Promise<{ configured: boolean; apiReady: boolean }>;
      getDatabaseSettings: () => Promise<Record<string, string> | null>;
      saveDatabaseSettings: (settings: Record<string, string>) => Promise<{ success: boolean; message?: string }>;
    };
  }
}

type Fixture = {
  matchId: number;
  matchNumber: number;
  status: string;
  isTiebreaker: boolean;
  player1: { id: number; name: string; tag: string; points: number };
  player2: { id: number; name: string; tag: string; points: number };
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [apiState, setApiState] = useState<"checking" | "online" | "offline">("checking");
  const [databaseState, setDatabaseState] = useState<"checking" | "online" | "offline">("checking");
  const [tournamentId, setTournamentId] = useState("1");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [message, setMessage] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
  const [dbSettings, setDbSettings] = useState({ DB_HOST: "localhost", DB_PORT: "3306", DB_USER: "root", DB_PASSWORD: "", DB_NAME: "cr_league" });

  const checkStatus = useCallback(async () => {
    try {
      if (window.desktop) {
        const status = await window.desktop.getDatabaseStatus();
        if (!status.configured) {
          setApiState("offline");
          setDatabaseState("offline");
          return;
        }
      }
      const response = await fetch(`${API_URL}/api/health`);
      setApiState(response.ok ? "online" : "offline");
      const dbResponse = await fetch(`${API_URL}/api/health/db`);
      setDatabaseState(dbResponse.ok ? "online" : "offline");
    } catch {
      setApiState("offline");
      setDatabaseState("offline");
    }
  }, []);

  const saveDatabaseSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!window.desktop) {
      setSetupMessage("Database setup is available in the desktop app. For web development, add the settings to backend/.env.");
      return;
    }
    setSavingSettings(true);
    setSetupMessage("Connecting to MySQL…");
    try {
      const result = await window.desktop.saveDatabaseSettings(dbSettings);
      if (!result.success) {
        setSetupMessage(result.message || "Could not connect to the database.");
        return;
      }
      setSetupOpen(false);
      setSetupMessage("");
      await checkStatus();
    } catch {
      setSetupMessage("Could not save database settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const loadFixtures = useCallback(async () => {
    const id = Number(tournamentId);
    if (!Number.isSafeInteger(id) || id < 1) {
      setMessage("Enter a valid tournament ID.");
      return;
    }
    setLoadingFixtures(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/tournaments/${id}/fixtures`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load fixtures.");
      setFixtures(result.data);
      setMessage(result.data.length ? "" : "No fixtures yet. Add fixtures to this tournament to see them here.");
    } catch (error) {
      setFixtures([]);
      setMessage(error instanceof Error ? error.message : "Could not connect to the API.");
    } finally {
      setLoadingFixtures(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (window.desktop) {
      void window.desktop.getDatabaseSettings().then((settings) => {
        if (settings) setDbSettings((current) => ({ ...current, ...settings }));
      });
    }
    void checkStatus();
    const timer = window.setInterval(() => void checkStatus(), 15000);
    return () => window.clearInterval(timer);
  }, [checkStatus]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="CR League Manager home">
          <span className="brand-mark">CR</span>
          <span className="brand-name">LEAGUE<span>MANAGER</span></span>
        </a>
        <div className="topbar-right">
          <span className="local-label"><i /> LOCAL WORKSPACE</span>
          <button className="setup-button" onClick={() => setSetupOpen((open) => !open)}>Database setup</button>
          <button className="icon-button" onClick={() => { void checkStatus(); void loadFixtures(); }} aria-label="Refresh">↻</button>
        </div>
      </header>

      {setupOpen && <form className="setup-panel" onSubmit={(event) => void saveDatabaseSettings(event)}>
        <div className="setup-copy"><span className="card-kicker">ONE-TIME SETUP</span><h2>Connect your database</h2><p>These settings stay on this computer and are used to connect the app to MySQL.</p></div>
        <label>HOST<input required value={dbSettings.DB_HOST} onChange={(event) => setDbSettings({ ...dbSettings, DB_HOST: event.target.value })} /></label>
        <label>PORT<input required type="number" min="1" max="65535" value={dbSettings.DB_PORT} onChange={(event) => setDbSettings({ ...dbSettings, DB_PORT: event.target.value })} /></label>
        <label>USERNAME<input required value={dbSettings.DB_USER} onChange={(event) => setDbSettings({ ...dbSettings, DB_USER: event.target.value })} /></label>
        <label>PASSWORD<input type="password" value={dbSettings.DB_PASSWORD} onChange={(event) => setDbSettings({ ...dbSettings, DB_PASSWORD: event.target.value })} /></label>
        <label className="wide-field">DATABASE NAME<input required value={dbSettings.DB_NAME} onChange={(event) => setDbSettings({ ...dbSettings, DB_NAME: event.target.value })} /></label>
        <div className="setup-actions"><span>{setupMessage}</span><button type="submit" disabled={savingSettings}>{savingSettings ? "Connecting…" : "Save and connect →"}</button></div>
      </form>}

      <section className="welcome">
        <div className="eyebrow"><span /> TOURNAMENT CONTROL</div>
        <h1>Run your league.<br /><em>One match at a time.</em></h1>
        <p>Your tournament desk for fixtures, players, and match day.</p>
      </section>

      <section className="status-grid" aria-label="Connection status">
        <StatusCard title="APP SERVER" state={apiState} description={apiState === "online" ? "Ready for requests" : apiState === "checking" ? "Checking connection…" : `Start the API on port ${new URL(API_URL).port || "3000"}`} />
        <StatusCard title="DATABASE" state={databaseState} description={databaseState === "online" ? "MySQL connected" : databaseState === "checking" ? "Checking connection…" : "Check backend/.env and MySQL"} />
        <div className="status-card quick-card"><span className="card-kicker">QUICK START</span><strong>Pick up where you left off</strong><span className="muted">Load a tournament to see its fixtures.</span></div>
      </section>

      <section className="fixtures-panel">
        <div className="panel-heading">
          <div><span className="card-kicker">MATCH DAY</span><h2>Fixtures</h2></div>
          <form className="load-form" onSubmit={(event) => { event.preventDefault(); void loadFixtures(); }}>
            <label htmlFor="tournament-id">TOURNAMENT ID</label>
            <input id="tournament-id" type="number" min="1" value={tournamentId} onChange={(event) => setTournamentId(event.target.value)} />
            <button type="submit" disabled={loadingFixtures}>{loadingFixtures ? "Loading…" : "Load fixtures"}<span>→</span></button>
          </form>
        </div>
        {fixtures.length > 0 ? (
          <div className="fixture-list">{fixtures.map((fixture) => (
            <article className="fixture-row" key={fixture.matchId}>
              <div className="match-number"><span>MATCH</span><strong>{String(fixture.matchNumber).padStart(2, "0")}</strong></div>
              <div className="versus"><div><strong>{fixture.player1.name}</strong><span>{fixture.player1.tag}</span></div><b>VS</b><div><strong>{fixture.player2.name}</strong><span>{fixture.player2.tag}</span></div></div>
              <div className="fixture-meta"><span className={`match-status ${fixture.status}`}>{fixture.status.replace("_", " ")}</span><span>{fixture.isTiebreaker ? "Tiebreaker · BO5" : "League match"}</span></div>
            </article>
          ))}</div>
        ) : (
          <div className="empty-state"><div className="empty-icon">⚔</div><strong>{message || "Your next match starts here"}</strong><p>{message ? "" : "Load a tournament above to see its upcoming fixtures."}</p></div>
        )}
      </section>

      <footer><span>CR LEAGUE MANAGER</span><span>MADE FOR THE NEXT MATCH <b>✦</b></span></footer>
    </main>
  );
}

function StatusCard({ title, state, description }: { title: string; state: "checking" | "online" | "offline"; description: string }) {
  return <div className="status-card"><div className="status-top"><span className="card-kicker">{title}</span><span className={`state-pill ${state}`}><i />{state === "online" ? "CONNECTED" : state === "checking" ? "CHECKING" : "OFFLINE"}</span></div><strong>{title === "APP SERVER" ? "API status" : "MySQL status"}</strong><span className="muted">{description}</span></div>;
}

export default App;
