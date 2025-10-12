import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
            🎮 American Tile Trails - Complete Guide
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Everything you need to know to play American Tile Trails
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-8 text-slate-100">
            {/* Overview */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🌟 Overview
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                American Title Trails is a tile-placement strategy game inspired
                by Carcassonne, set in the American landscape. Players take
                turns placing tiles to build roads, Costco shopping areas, and
                McDonald's restaurants while claiming features with followers to
                score points.
              </p>
            </section>

            <Separator className="bg-slate-700" />

            {/* Objective */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🎯 Objective
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Score the most points by strategically placing tiles and
                claiming completed features with your followers.
              </p>
            </section>

            <Separator className="bg-slate-700" />

            {/* Game Setup */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🎲 Game Setup
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">
                    Player Configuration
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      <span>
                        <strong className="text-white">
                          Number of Players:
                        </strong>{" "}
                        2-5 players (mix of human and AI players)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      <span>
                        <strong className="text-white">Player Setup:</strong>{" "}
                        Enter player names, choose colors, select human or AI
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      <span>
                        <strong className="text-white">
                          Starting Resources:
                        </strong>{" "}
                        Each player begins with 7 followers
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">
                    Starting the Game
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      <span>
                        The game begins with a starting tile (Route 66
                        Crossroads) placed in the center
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Players are randomly assigned turn order</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="bg-slate-700" />

            {/* How to Play */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🎮 How to Play
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Each turn consists of up to 3 phases:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-300 mb-2">
                    1. Tile Placement Phase 🎯
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-green-400">•</span>
                      <span>
                        <strong className="text-white">Draw a Tile:</strong> You
                        automatically receive a random tile from the deck
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">•</span>
                      <span>
                        <strong className="text-white">Rotate the Tile:</strong>{" "}
                        Click "Rotate Tile" button to change orientation
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">•</span>
                      <span>
                        <strong className="text-white">Place the Tile:</strong>{" "}
                        Click on a valid (green highlighted) position on the
                        board
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">
                    2. Feature Claiming Phase 🏴 (Optional)
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>
                        After placing a tile, you may claim ONE feature on that
                        tile
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>
                        <strong className="text-white">Roads:</strong> Claim a
                        road segment
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>
                        <strong className="text-white">Costco Areas:</strong>{" "}
                        Claim a shopping area
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>
                        <strong className="text-white">McDonald's:</strong>{" "}
                        Claim the restaurant (worth 9 points when surrounded)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>
                        You must have available followers to claim features
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-orange-300 mb-2">
                    3. Scoring Phase 📊 (Automatic)
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-orange-400">•</span>
                      <span>Completed features are scored instantly</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-400">•</span>
                      <span>
                        Followers return to your supply when features complete
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="bg-slate-700" />

            {/* Controls */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🎮 Controls & Interface
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-cyan-300 mb-2">
                    Board Interaction
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>
                        <strong className="text-white">Zoom:</strong> Mouse
                        wheel to zoom in/out (25% - 400%)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>
                        <strong className="text-white">Pan:</strong> Click and
                        drag to move around the board
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>
                        <strong className="text-white">Tile Placement:</strong>{" "}
                        Click on green highlighted areas to place tiles
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>
                        <strong className="text-white">Hover Preview:</strong>{" "}
                        See tile preview when hovering over valid positions
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="bg-slate-700" />

            {/* Scoring System */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🏆 Scoring System
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-red-300 mb-2">🛣️ Roads</h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-red-400">•</span>
                      <span>
                        <strong className="text-white">Points:</strong> 1 point
                        per tile the road passes through
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">•</span>
                      <span>
                        <strong className="text-white">Completion:</strong>{" "}
                        Roads are complete when they form a continuous path with
                        both ends connected
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">
                    🏪 Costco Shopping Areas
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      <span>
                        <strong className="text-white">Points:</strong> 2 points
                        per tile the area covers
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      <span>
                        <strong className="text-white">Completion:</strong>{" "}
                        Complete when they form a closed region with no open
                        edges
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      <span>
                        <strong className="text-white">Value:</strong> Worth
                        double points compared to roads
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-yellow-300 mb-2">
                    🍟 McDonald's Restaurants
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>
                        <strong className="text-white">Points:</strong> 9 points
                        (fixed value)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>
                        <strong className="text-white">Completion:</strong>{" "}
                        Complete when all 8 surrounding positions have tiles
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>
                        <strong className="text-white">Risk/Reward:</strong>{" "}
                        Difficult to complete but worth many points
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-300 mb-2">
                    Game End Scoring
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-gray-400">•</span>
                      <span>
                        <strong className="text-white">
                          Incomplete Features:
                        </strong>{" "}
                        1 point per tile for any uncompleted claimed features
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-gray-400">•</span>
                      <span>
                        <strong className="text-white">Winner:</strong> Player
                        with the most total points wins
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="bg-slate-700" />

            {/* AI Players */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🤖 AI Players
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-indigo-300 mb-2">
                    AI Behavior
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-indigo-400">•</span>
                      <span>AI players make moves with a 1-second delay</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">•</span>
                      <span>
                        AI considers feature completion opportunities, tile
                        adjacency, Costco preferences, and follower conservation
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">•</span>
                      <span>
                        AI players are marked with 🤖 in the scoreboard
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="bg-slate-700" />

            {/* Strategy Tips */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                💡 Strategy Tips
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-emerald-300 mb-2">
                    General Strategy
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>
                        <strong className="text-white">
                          Balance Claiming and Expansion:
                        </strong>{" "}
                        Don't use all followers early
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>
                        <strong className="text-white">Block Opponents:</strong>{" "}
                        Place tiles to prevent opponents from completing
                        valuable features
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>
                        <strong className="text-white">Plan Ahead:</strong>{" "}
                        Consider how your tile placement affects future turns
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>
                        <strong className="text-white">
                          Feature Priority:
                        </strong>{" "}
                        McDonald's are valuable but risky; roads are safer but
                        lower value
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-pink-300 mb-2">
                    Advanced Tactics
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed ml-4">
                    <li className="flex gap-2">
                      <span className="text-pink-400">•</span>
                      <span>
                        <strong className="text-white">Shared Features:</strong>{" "}
                        Multiple players can claim the same feature from
                        different tiles
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-400">•</span>
                      <span>
                        <strong className="text-white">Feature Denial:</strong>{" "}
                        Place tiles to make opponent features harder to complete
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-400">•</span>
                      <span>
                        <strong className="text-white">
                          Follower Management:
                        </strong>{" "}
                        Keep some followers in reserve for high-value
                        opportunities
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="bg-slate-700" />

            {/* Winning Conditions */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🎯 Winning Conditions
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>
                    <strong className="text-white">Game End:</strong> Game ends
                    when no more tiles remain in the deck
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>
                    <strong className="text-white">Final Scoring:</strong> All
                    incomplete features score 1 point per tile
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>
                    <strong className="text-white">Winner:</strong> Player with
                    highest total score wins (tied players share victory)
                  </span>
                </li>
              </ul>
            </section>

            <Separator className="bg-slate-700" />

            {/* Getting Started */}
            <section>
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                🚀 Getting Started
              </h3>
              <ol className="space-y-2 text-sm leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-amber-400 font-mono">1.</span>
                  <span>
                    <strong className="text-white">Configure Players:</strong>{" "}
                    Set up 2-5 players with names and types
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-mono">2.</span>
                  <span>
                    <strong className="text-white">Start Playing:</strong> Begin
                    placing tiles and claiming features
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-mono">3.</span>
                  <span>
                    <strong className="text-white">Learn by Playing:</strong>{" "}
                    The interface guides you through each phase
                  </span>
                </li>
              </ol>
            </section>

            {/* Final Note */}
            <section className="bg-slate-700 rounded-lg p-4 mt-8">
              <p className="text-center text-slate-300 text-sm">
                <strong className="text-amber-300">
                  🗺️ Have fun building your American landscape!
                </strong>
                <br />
                <span className="text-xs">
                  The game combines strategic thinking with tactical tile
                  placement for an engaging multiplayer experience. Each game
                  creates a unique map of roads, shopping centers, and
                  restaurants across the American countryside.
                </span>
              </p>
            </section>

            <div className="flex justify-center pt-4">
              <Button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Got it!
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
