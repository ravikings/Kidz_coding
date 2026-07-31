Act as a front-end web developer and child behavioral incentive designer.

Update the offline Java learning web app (`index.html`) to include a Points and Cash Reward Tracking System that motivates young kids to reach a $40 total parent-provided reward upon completing all levels.

### New Features & Requirements:

1. **Header Reward Dashboard:**
   - Display a highly visible top banner showing:
     - **Current Points** (e.g., "Points: 2,500")
     - **Dollar Progress** (e.g., "Earned Reward: $10.00 / $40.00")
     - Visual progress bar that fills up as levels are completed (0% to 100% / $0 to $40).
   - Calculate cash progress based on completed levels (e.g., with 100 levels, each completed level adds **+100 Points** and **+$0.40** toward the $40 goal).

2. **Level Completion Reward Modal/Popup:**
   - When a user correctly completes a level, trigger a clean reward popup overlay:
     - Shows "+100 Points!" and "+$0.40 added to your reward pot!"
     - Updates total balance immediately.
     - Play a simple browser audio chime or show visual celebration effect (confetti CSS).

3. **$40 Parent Reward Certificate & Voucher Screen:**
   - When total points reach 100% (or $40.00 earned), unlock a prominent **"Claim Your $40 Reward"** button.
   - Clicking this opens a clean, kid-friendly "Official Java Master Certificate":
     - Text: *"Congratulations! You have completed all Java lessons and earned your $40 Reward from your Parents!"*
     - Includes a printable layout (`window.print()`) so the child can physically print or show the screen to their parents to claim their prize.
     - Include a custom text field where parents can type what the $40 prize is for (e.g., "Toy Store Pass", "New Book & Treat", or "$40 Allowance").

4. **Parent Controls & Persistence:**
   - Store total points, dollars earned, and completed level status in `localStorage`.
   - Add a simple "Parent Pin / Confirmation" prompt before resetting progress so kids don't accidentally erase their earnings.

Modify the single-file HTML/CSS/JS code to fully integrate these gamified reward mechanics cleanly into the interface.