# Basketball Prediction CLI Devjournal

## Project Overview
Building a basketball prediction CLI system with $0 budget, focusing on value betting rather than winner prediction. The goal is to create a systematic approach to identifying mispriced odds through mathematical modeling and data analysis.

## 1. Core Mindset & Philosophy

### How Successful Basketball Bettors Think Differently
**Key Shift:** You're not predicting the game — you're pricing the game better than the bookmaker.

#### Successful Bettor Characteristics:
- Bets on whether odds are wrong (value identification)
- Focuses on numbers, not narratives
- Accepts small edges repeatedly
- Thinks long-term (hundreds of bets)
- Prioritizes process over results

#### Mindset Transformation:
- Move from "Who will win?" to "Are these odds accurate?"
- Embrace variance - profitable long-term even with short-term losses
- Focus on edge, not certainty

## 2. Fundamental Edges to Look For

### 1. Line Value (Most Important)
**Question to ask:** "Is the bookmaker's line accurate?"

**Example:**
- Bookmaker spread: Lakers -4.5
- Your model: Lakers -1.5
- 3 points of value = BET

**Key Insight:** You can lose bets and still profit if the price was good.

### 2. Advanced Stats (Not Box Score Stats)
**Casual Focus:**
- Points, rebounds, win-loss record

**Pro Focus:**
- Offensive Rating (ORtg)
- Defensive Rating (DRtg)
- Net Rating
- Pace
- Effective FG%
- Turnover Rate
- Free Throw Rate

**Example:**
- Team A: Wins often, negative Net Rating
- Team B: Loses games, positive Net Rating
- Team B is undervalued

### 3. Situational Angles (Huge Edge)
**Track these factors:**
- Back-to-back games (fatigue)
- Travel distance
- Home/road splits
- Rest advantage (2+ days)
- Altitude effects (Denver, Utah)
- Revenge spots (previous matchup losses)

**Example:**
- Team on 3rd road game in 4 nights
- Facing well-rested home team
- Fade the tired team

### 4. Injuries & Rotation Impact (Not Just Star Power)
**Calculate:**
- On/Off impact (team performance with/without player)
- Bench depth
- Matchup fit

**Example:** A missing "role player" who guards pick-and-roll may matter more than a missing scorer.

### 5. Market Timing
- Early lines = sharp money influence
- Late lines = public money influence

**Strategies:**
- Bet early when model disagrees with opening line
- Fade public hype late (especially playoffs)

## 3. The Mathematical Foundation

### Predictions Based On
Successful bettors rely on **probability + expected value**, not certainty.

### 4. Core Calculation: Expected Value (EV)
```
EV = (Win Probability × Odds Payout) − (Loss Probability × Stake)
```

**If EV > 0 → Profitable bet**

**Example:**
- Your model: 55% win probability
- Book odds imply 50%
- 5% difference = edge

## 5. How Basketball Models Actually Work (Simplified)

### Step 1: Team Power Ratings
```
Power Rating = Offensive Rating − Defensive Rating
```

**Adjust for:**
- Pace
- Home court (~2-3 points NBA)
- Injuries
- Rest

### Step 2: Project Game Score
```
Expected Margin = Team A Rating − Team B Rating
```

**Example:**
- Your model: Celtics -3
- Bookmaker: Celtics -6
- Take the underdog

### Step 3: Convert Margin to Probability
**Methods:**
- Normal distribution
- Logistic regression
- Elo-style models

**Simplified Formula:**
```
Win Probability = 1 / (1 + e^(-margin / scale))
```

## 6. Market-Specific Analysis

### 1. TOTAL POINTS (Over / Under)
**Core Shift:** Stop asking "Who's better?" Start asking "How many possessions and how efficient?"

#### What Sharp Bettors Look For:

1. **Pace (MOST IMPORTANT)**
   ```
   Total Points = Possessions × Points Per Possession
   ```
   - Track pace vs opponent (pace-down or pace-up)
   - Fast team vs slow team usually follows slower pace

2. **Offensive vs Defensive Efficiency**
   - Focus on points per 100 possessions, not PPG
   ```
   Expected PPP = (Team ORtg + Opponent DRtg) / 200
   ```

3. **Shot Profile Matchups**
   - 3PT attempt rate
   - Rim attempts allowed
   - Midrange vs rim defenses

   **Example:** Team living on 3s vs opponent that runs shooters off the line = Under value

4. **Referee & Foul Tendencies**
   - High FT games → overs
   - Low FT games → unders

5. **Game Context**
   - Blowout risk → late-game unders
   - Playoff vs regular season
   - Division familiarity (unders trend)

**Total Points Formula:**
```
Expected Total = Avg Possessions × Avg PPP × 2
```
Bet if your total differs by 3-4+ points from the book.

### 2. INDIVIDUAL TEAM TOTALS
**Key Insight:** Books misprice these more often than full-game totals.

#### What Sharp Bettors Focus On:

1. **Opponent Defensive Matchups**
   - Defense vs specific style, not overall
   **Example:** Team relies on paint scoring vs elite rim protector = UNDER

2. **Rotation & Usage Changes**
   - Usage redistribution when star is out
   - Bench efficiency impact
   **Example:** Star out → pace slows = UNDER, but ball movement increases = OVER

3. **Scoring Distribution**
   - Does opponent allow high-volume 3s?
   - Does team depend on transition points?

**Team Total Formula:**
```
Team Total = Team Possessions × Team PPP vs Opponent
```
Where: `Team PPP = (Team ORtg + Opponent DRtg) / 200`

### 3. HANDICAP / SPREAD BETTING
**Core Shift:** Focus on margin, not just winner.

#### What Sharps Look For:

1. **Margin Distribution**
   - How teams win/lose
   - Garbage-time scoring patterns
   **Example:** Strong starters, weak bench often lead early but fail to cover large spreads

2. **Underdog Inflation**
   - Public bets favorites
   - Take dogs + points, especially road dogs with rest advantage

3. **Correlation With Totals**
   - High total → points more valuable
   - Low total → points less valuable
   **Example:** +8 in 202 total worth more than +8 in 238 total

**Spread Projection:**
```
Projected Spread = Team A Net Rating − Team B Net Rating + Home Court + Rest Adjustment
```

### 4. Why Pros Often Combine These Markets
Look for disagreement between markets.

**Example:**
- Game total: HIGH
- Underdog + points
- Correlated value

**Or:**
- Favorite -10
- Team total UNDER
- Favorite wins with slower pace

## 7. Data Sources & Resources

### Global Major Basketball Leagues

#### United States / North America
- **NBA**: nba.com
- **WNBA**: wnba.com
- **G League**: gleague.nba.com
- **NCAA Division I**: ncaa.com

#### Europe
- **EuroLeague**: euroleaguebasketball.net/euroleague
- **EuroCup**: euroleaguebasketball.net/eurocup
- **Basketball Champions League**: championsleague.basketball
- **Spain - Liga ACB**: acb.com
- **Turkey - BSL**: tblstat.net or tbf.org.tr
- **Greece - Greek Basket League**: esake.gr
- **France - LNB Pro A**: lnb.fr
- **Germany - Basketball Bundesliga**: easycredit-bbl.de
- **Italy - Lega Basket Serie A**: legabasket.it
- **Serbia - KLS**: kls.rs
- **Lithuania - LKL**: lkl.lt
- **Adriatic League (ABA)**: aba-liga.com

#### Asia
- **CBA (China)**: cba.net.cn
- **B.League (Japan)**: bleague.jp/en
- **KBL (Korea)**: kbl.or.kr
- **PBA (Philippines)**: pba.ph
- **ABL (ASEAN)**: aseanbasketballleague.com
- **IBL (Indonesia)**: iblindonesia.com
- **SBL (Taiwan)**: sbl.org.tw

#### Middle East
- **Iran Super League**: iranbasketball.ir
- **Israeli Premier League**: basket.co.il
- **Lebanese League**: flb.org.lb
- **Saudi League**: sbf.gov.sa
- **Qatar League**: qbf.qa
- **UAE League**: uaebasketball.ae

#### Africa
- **BAL**: bal.nba.com
- **Nigeria Premier**: npbl.com.ng
- **Egypt Super League**: ebsf.org.eg
- **Tunisia National A**: ftbb.org.tn
- **Angola League**: fab.ao

#### South America
- **Argentina Liga Nacional**: lnb.com.ar
- **Brazil NBB**: lnb.com.br
- **Liga Sudamericana**: fiba.basketball
- **Chile Liga ACB**: feba.cl
- **Venezuela SuperLiga**: fvb.com.ve

#### Oceania
- **Australia NBL**: nbl.com.au
- **New Zealand NBL**: nznbl.basketball

## 8. Building a Profitable System

### Required Components for Profitability

| Component | Description | Why Needed |
|-----------|-------------|------------|
| **Core Mindset** | Shift from picking winners to finding mispriced odds | Prevents deviation during losing streaks |
| **Quantitative Foundation** | Power rating system (adjusted net rating) | Objective, repeatable baseline |
| **Data Sources** | Historical stats, injury reports, schedules, market odds | Fuel for the model and value identification |
| **Adjustment Framework** | Systematic adjustments for home court, rest, injuries, pace | Captures situational edges the market misprices |
| **Market Analysis & Timing** | Line shopping, sharp vs public money tracking | Impacts long-term ROI |
| **Bankroll & Staking** | Dedicated bankroll, percentage-based staking | Survives variance, enables compounding |
| **Execution & Tracking** | Daily model runs, bet logging, performance audit | Ensures discipline and continuous improvement |
| **Review & Iteration** | Regular backtesting, model adjustments | Maintains edge as market adapts |

## 9. Implementation Blueprint

### Simplified Model Construction

#### Step 1: Build Base Power Rating
Use adjusted net rating (points per 100 possessions differential, adjusted for opponent/venue) as core metric. Start with league average (0) and adjust based on results.

#### Step 2: Project Single Game
```
Projected Margin = (Team A Rating - Team B Rating) + Home Court Advantage (+3.5 NBA)
```
Adjust for rest (+0.3 points per extra day), back-to-backs, travel, etc.

#### Step 3: Convert Margin to Win Probability
Use logistic distribution or standard deviation (~11-12 points NBA).
```
Win Probability = 1 / (1 + exp(-k × projected margin))
```

#### Step 4: Find Value
Convert sportsbook odds to implied probability. If model probability > implied probability + vig-adjusted threshold (2-3%), you have value.

#### Step 5: Specialize in a Market
- **Totals**: Project pace (possessions/game) and efficiency (points/possession)
- **Spreads**: Focus on margin distribution, clutch performance, garbage time
- **Team Totals**: Apply same principles to individual team matchups

#### Step 6: Manage & Iterate
- Start with small stakes
- Track closing line value (CLV)
- Review monthly: Edge from model or luck?
- Adjust for trends, rule changes, meta shifts

**Profitability Principle:** Consistently identify small edges where your model prices games more accurately than the market, while managing money to withstand variance.
