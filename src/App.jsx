
import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalMessages, setTotalMessages] = useState(0);
  const [flaggedMessages, setFlaggedMessages] = useState(0);
  const [reviewedCases, setReviewedCases] = useState(0);
  const [reviewQueue, setReviewQueue] = useState([]);

  const analyzeMessage = async () => {
    if (!message.trim()) {
      setError("Please enter a message first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Analysis failed");
      }

      setResult(data);
      setTotalMessages((prev) => prev + 1);

      if (data.analysis.label === "abusive") {
        setFlaggedMessages((prev) => prev + 1);

        setReviewQueue((prev) => [
          ...prev,
          {
            id: Date.now(),
            message: data.original_message || message,
            score: data.analysis.abusive_score ?? 0,
            status: "Pending",
          },
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReview = (id, status) => {
    setReviewQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );

    setReviewedCases((prev) => prev + 1);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🛡️ IndicSafe</h2>
        <p className="menu-title">MAIN MENU</p>
        <div className="menu active">📊 Dashboard</div>
        <div className="menu">🔍 Message Analysis</div>
        <div className="menu">🚨 Review Queue</div>
        <div className="menu">🌐 Languages</div>
        <div className="menu">📈 SDG Impact</div>
        <div className="menu">⚙️ Settings</div>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>Dashboard Overview</h1>
            <p>AI-powered Indic Language Moderation</p>
          </div>
          <span className="status">● System Online</span>
        </header>

        <section className="stats">
          <div className="card">
            <h3>Total Messages</h3>
            <h1>{totalMessages}</h1>
            <p>Messages analyzed</p>
          </div>

          <div className="card">
            <h3>Flagged Messages</h3>
            <h1>{flaggedMessages}</h1>
            <p>Sent for review</p>
          </div>

          <div className="card">
            <h3>Reviewed Cases</h3>
            <h1>{reviewedCases}</h1>
            <p>Human moderator decisions</p>
          </div>

          <div className="card">
            <h3>Languages</h3>
            <h1>8</h1>
            <p>Planned language coverage</p>
          </div>
        </section>

        <section className="analyzer">
          <h2>🔍 AI Message Analyzer</h2>
          <p>Enter a message for multilingual content screening.</p>

          <textarea
            placeholder="Enter Hindi, Hinglish, Tamil or English message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button onClick={analyzeMessage} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Message"}
          </button>

          {error && (
            <div className="result">
              <p>⚠️ {error}</p>
            </div>
          )}

          {result && (
            <div className="result">
              <h3>Analysis Result</h3>
              <p>
                <strong>Prediction: </strong>
                {result.analysis.label.toUpperCase()}
              </p>

              <p>
                <strong>Normal Score: </strong>
                {result.analysis.normal_score != null
                  ? (result.analysis.normal_score * 100).toFixed(2) + "%"
                  : "Not available"}
              </p>

              <p>
                <strong>Abusive Score: </strong>
                {result.analysis.abusive_score != null
                  ? (result.analysis.abusive_score * 100).toFixed(2) + "%"
                  : "Not available"}
              </p>

              <p>
                <strong>Normalized Message: </strong>
                {result.normalized_message}
              </p>

              <small>
                AI screening is a signal, not a final moderation decision.
              </small>
            </div>
          )}
        </section>

        <section className="analyzer">
          <h2>🚨 Moderator Review Queue</h2>
          <p>Review messages flagged by the AI model.</p>

          {reviewQueue.length === 0 ? (
            <p>No messages waiting for review.</p>
          ) : (
            reviewQueue.map((item) => (
              <div className="result" key={item.id}>
                <h3>Flagged Message</h3>
                <p><strong>Message:</strong> {item.message}</p>
                <p>
                  <strong>Abusive Score:</strong>{" "}
                  {(item.score * 100).toFixed(2)}%
                </p>
                <p><strong>Status:</strong> {item.status}</p>

                {item.status === "Pending" && (
                  <>
                    <button onClick={() => updateReview(item.id, "Approved")}>
                      Approve
                    </button>

                    <button onClick={() => updateReview(item.id, "Rejected")}>
                      Reject
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </section>

        <section className="sdg">
          <div className="sdg-card">
            <h2>🎓 SDG 4</h2>
            <h3>Quality Education</h3>
            <p>
              Supporting safer and inclusive digital learning communities.
            </p>
          </div>

          <div className="sdg-card">
            <h2>⚖️ SDG 16</h2>
            <h3>Peace, Justice & Strong Institutions</h3>
            <p>
              Promoting transparent and accountable digital moderation.
            </p>
          </div>
        </section>

        <footer>
          IndicSafe © 2026 | Responsible AI Moderation
        </footer>
      </main>
    </div>
  );
}

export default App;
