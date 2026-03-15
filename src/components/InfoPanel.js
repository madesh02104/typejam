"use client";

import { useState } from "react";
import { INSTRUMENTS } from "../lib/instruments";
import { rows, noteMap } from "../lib/keys";
import styles from "./InfoPanel.module.css";

export default function InfoPanel() {
  const [activeTab, setActiveTab] = useState("how-it-works");
  const [selectedInstInTab, setSelectedInstInTab] = useState(null);

  const tabs = [
    { id: "how-it-works", label: "How it works" },
    { id: "keymappings", label: "Keymappings" },
    // { id: "contribute", label: "Contribute" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "how-it-works":
        return (
          <div className={styles.content}>
            <p>
              To make professional music you need to learn how instruments work
              and certain notes that form up a tune. Sometimes I spin up some
              tunes in mind while listening to music. But as someone who does
              not have this knowledge to understand the notes and play them on
              instruments I cannot reproduce it.
            </p>

            <p>
              I&apos;m trying to solve this problem with TypeJam. Here in
              TypeJam, each key in the keyboard is mapped with a note(both
              native and tone down-ed/up-ed notes) such that all instruments
              follow a pattern while producing a sound from specific a key.
            </p>

            <p>
              This pattern helps us to memorize a specific layout of sound
              profile of the keyboard in our mind within few tries and lets us
              make small musical tunes in just minutes, without needing to
              understand the notes.
            </p>

            <h3>How Notes are Mapped</h3>
            <p>
              TypeJam organizes musical <strong>pitch</strong> (how high or low
              a note sounds) based on the physical position of keys:
            </p>
            <ul>
              <li>
                <strong>Vertical Layout (Rows)</strong> — The rows are stacked
                by pitch range.
                <br />
                <span
                  style={{
                    display: "block",
                    marginTop: "4px",
                    fontSize: "0.95em",
                    color: "var(--text-secondary)",
                  }}
                >
                  Top Row (Q-P) is High pitch.
                  <br />
                  Middle Row (A-L) is Mid pitch.
                  <br />
                  Bottom Row (Z-M) is Low pitch.
                </span>
              </li>
              <li>
                <strong>Horizontal Layout</strong> — Within each row, notes go
                from <strong>lower to higher</strong> pitch as you move from
                left to right.
              </li>
            </ul>

            <h3>Getting Started</h3>
            <ul>
              <li>
                <strong>Select an instrument</strong> from the list
              </li>
              <li>
                <strong>Play</strong> by pressing QWERTY keys
              </li>
              <li>
                <strong>Record</strong> your performance
              </li>
              <li>
                <strong>Arrange</strong> clips on the timeline
              </li>
              <li>
                <strong>Export</strong> your tune
              </li>
            </ul>

            <div className={styles.noteBox}>
              <p>
                Even though it is hard to produce professional grade music with
                this, it will help a naive user to enjoy creating small musical
                tunes.
              </p>
            </div>
          </div>
        );

      case "keymappings":
        return (
          <div className={styles.content}>
            <h2>Available Instruments</h2>
            <div className={styles.instrumentsList}>
              {Object.keys(INSTRUMENTS).map((inst) => (
                <div key={inst}>
                  <div
                    className={`${styles.instrumentItem} ${
                      selectedInstInTab === inst ? styles.active : ""
                    }`}
                    onClick={() =>
                      setSelectedInstInTab(
                        selectedInstInTab === inst ? null : inst,
                      )
                    }
                  >
                    <span className={styles.instrumentName}>
                      {inst.charAt(0).toUpperCase() + inst.slice(1)}
                    </span>
                  </div>
                  {selectedInstInTab === inst && (
                    <div className={styles.inlineValues}>
                      <h3
                        style={{
                          marginTop: "16px",
                          marginBottom: "12px",
                          fontSize: "1rem",
                        }}
                      >
                        Key Layout —{" "}
                        {selectedInstInTab.charAt(0).toUpperCase() +
                          selectedInstInTab.slice(1)}
                      </h3>
                      <div className={styles.keyLayout}>
                        <div className={styles.rowGroup}>
                          <div className={styles.rowLabel}>Top Row</div>
                          <div className={styles.keys}>
                            {rows.top.map((key) => (
                              <div key={key} className={styles.keyButton}>
                                <div className={styles.keyLabel}>{key}</div>
                                <div className={styles.noteLabel}>
                                  {noteMap.get(key)?.note}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={styles.rowGroup}>
                          <div className={styles.rowLabel}>Middle Row</div>
                          <div className={styles.keys}>
                            {rows.mid.map((key) => (
                              <div key={key} className={styles.keyButton}>
                                <div className={styles.keyLabel}>{key}</div>
                                <div className={styles.noteLabel}>
                                  {noteMap.get(key)?.note}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={styles.rowGroup}>
                          <div className={styles.rowLabel}>Bottom Row</div>
                          <div className={styles.keys}>
                            {rows.bot.map((key) => (
                              <div key={key} className={styles.keyButton}>
                                <div className={styles.keyLabel}>{key}</div>
                                <div className={styles.noteLabel}>
                                  {noteMap.get(key)?.note}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      //   case "contribute":
      //     return (
      //       <div className={styles.content}>
      //         <h2>Contribute to TypeJam</h2>
      //         <p>
      //           TypeJam is open-source and welcomes contributions! Whether
      //           it&apos;s bug fixes, new features, or improvements, your help
      //           matters.
      //         </p>
      //         <p>
      //           <strong>Get involved:</strong>
      //         </p>
      //         <ul>
      //           <li>
      //             <a
      //               href="https://github.com/madesh02104/typejam"
      //               target="_blank"
      //               rel="noopener noreferrer"
      //             >
      //               Visit the GitHub repository
      //             </a>
      //           </li>
      //           <li>Report issues and suggest features</li>
      //           <li>Submit pull requests with improvements</li>
      //           <li>Help with documentation</li>
      //         </ul>
      //         <p>
      //           Every contribution helps make TypeJam better for everyone. Thank
      //           you! ♪
      //         </p>
      //       </div>
      //     );

      default:
        return null;
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>{renderContent()}</div>
    </div>
  );
}
