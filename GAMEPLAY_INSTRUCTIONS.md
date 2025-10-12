# 🎮 American Title Trails - Gameplay Instructions

## Overview

American Title Trails is a tile-placement strategy game inspired by Carcassonne, set in the American landscape. Players take turns placing tiles to build roads, Costco shopping areas, and McDonald's restaurants while claiming features with followers to score points.

## 🎯 Objective

Score the most points by strategically placing tiles and claiming completed features with your followers.

## 🎲 Game Setup

### Player Configuration

1. **Number of Players**: 2-5 players (mix of human and AI players)
2. **Player Setup**:
   - Enter player names
   - Choose player colors
   - Select human or AI for each player
3. **Starting Resources**: Each player begins with 7 followers

### Starting the Game

- The game begins with a starting tile (Route 66 Crossroads) placed in the center
- Players are randomly assigned turn order
- The first player draws a tile to begin

## 🎮 How to Play

### Turn Structure

Each turn consists of up to 3 phases:

#### 1. **Tile Placement Phase** 🎯

- **Draw a Tile**: You automatically receive a random tile from the deck
- **Rotate the Tile**: Click "Rotate Tile" button to change orientation (0°, 90°, 180°, 270°)
- **Place the Tile**: Click on a valid position on the board
  - Tiles must be placed adjacent to existing tiles
  - All edges must match (road-to-road, field-to-field)
  - Valid placement positions are highlighted in green

#### 2. **Feature Claiming Phase** 🏴 (Optional)

- **After placing a tile**, you may claim ONE feature on that tile
- **Claiming Options**:
  - **Roads**: Claim a road segment
  - **Costco Areas**: Claim a shopping area
  - **McDonald's**: Claim the restaurant (worth 9 points when surrounded)
- **Requirements**: You must have available followers (not already placed on the board)
- **Choice**: Click a "Claim" button or "Skip Claiming"

#### 3. **Scoring Phase** 📊 (Automatic)

- **Immediate Scoring**: Completed features are scored instantly
- **Follower Return**: Followers return to your supply when features complete
- **Turn End**: Game automatically advances to the next player

### Controls & Interface

#### Board Interaction

- **Zoom**: Mouse wheel to zoom in/out (25% - 400%)
- **Pan**: Click and drag to move around the board
- **Tile Placement**: Click on green highlighted areas to place tiles
- **Hover Preview**: See tile preview when hovering over valid positions

#### Game Controls

- **Rotate Tile**: Change tile orientation before placing
- **New Game**: Restart with new player configuration
- **Activity Log**: See recent game events and scoring

## 🏆 Scoring System

### Completed Features (Immediate Scoring)

#### 🛣️ Roads

- **1 point per tile** the road passes through
- **Completion**: Roads are complete when they form a continuous path with both ends connected to:
  - Other roads (forming intersections)
  - The center of a tile
  - Dead ends (cul-de-sacs)

#### 🏪 Costco Shopping Areas

- **2 points per tile** the area covers
- **Completion**: Costco areas are complete when they form a closed region with no open edges
- **Higher Value**: Worth double points compared to roads

#### 🍟 McDonald's Restaurants

- **9 points** (fixed value)
- **Completion**: Complete when all 8 surrounding positions have tiles
- **High Risk/Reward**: Difficult to complete but worth many points

### Game End Scoring

- **Incomplete Features**: 1 point per tile for any uncompleted claimed features
- **Final Tally**: Player with the most total points wins

## 🤖 AI Players

### AI Behavior

- **Automatic Turns**: AI players make moves with a 1-second delay
- **Strategy**: AI considers:
  - Feature completion opportunities
  - Tile adjacency for future placement
  - Costco area preferences
  - Follower conservation

### Playing with AI

- AI turns are processed automatically
- Watch the Activity Log to see AI decisions
- AI players are marked with 🤖 in the scoreboard

## 💡 Strategy Tips

### General Strategy

1. **Balance Claiming and Expansion**: Don't use all followers early
2. **Block Opponents**: Place tiles to prevent opponents from completing valuable features
3. **Plan Ahead**: Consider how your tile placement affects future turns
4. **Feature Priority**: McDonald's are valuable but risky; roads are safer but lower value

### Advanced Tactics

1. **Shared Features**: Multiple players can claim the same feature from different tiles
2. **Feature Denial**: Place tiles to make opponent features harder to complete
3. **Follower Management**: Keep some followers in reserve for high-value opportunities
4. **End Game**: Focus on completing your claimed features as the tile supply runs low

## 🎯 Winning Conditions

### Game End

- **Tile Depletion**: Game ends when no more tiles remain in the deck
- **Final Scoring**: All incomplete features score 1 point per tile
- **Winner Determination**: Player with highest total score wins
- **Tie Breaking**: Tied players share victory

### Victory Display

- Game Over screen shows final scores
- Winner announcement
- Option to start a new game

## 🔧 Technical Features

### Visual Feedback

- **Valid Placements**: Green highlights show legal positions
- **Hover Previews**: Blue overlay shows tile placement preview
- **Current Player**: Arrow (▶) indicates whose turn it is
- **Feature Claims**: Visual indicators for claimed features

### Game Statistics

- **Turn Counter**: Current turn number
- **Tiles Remaining**: Number of unplaced tiles
- **Player Stats**: Score, available followers per player
- **Activity Log**: Turn-by-turn game history

## 🚀 Getting Started

1. **Launch Game**: Open http://localhost:3000 in your browser
2. **Configure Players**: Set up 2-5 players with names and types
3. **Start Playing**: Begin placing tiles and claiming features
4. **Learn by Playing**: The interface guides you through each phase

## 🎪 Game Variants

### Beginner Mode

- Focus on road completion for consistent scoring
- Avoid complex Costco areas until comfortable with rules
- Use AI players to learn strategies

### Advanced Play

- Mix human and AI players for varied gameplay
- Experiment with different claiming strategies
- Master the art of feature blocking and sharing

---

**Have fun building your American landscape!** 🗺️

The game combines strategic thinking with tactical tile placement for an engaging multiplayer experience. Each game creates a unique map of roads, shopping centers, and restaurants across the American countryside.
