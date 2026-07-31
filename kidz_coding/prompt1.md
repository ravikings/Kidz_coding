Act as an expert front-end web developer and educational software designer. 

Create a complete, single-file offline web application (`index.html`) that runs locally in Google Chrome without any server or internet connection. This app is designed to teach Java syntax and concepts to young beginners (ages 5+) through a clean, non-game, structured text/block interface.

### Technical & UI Requirements:
1. **Single File Structure:** Embed all HTML, CSS, and JavaScript into a single `index.html` file so it can be opened by double-clicking it on a computer.
2. **Layout:** Split-screen interface:
   - **Left Panel:** Level selector (Levels 1–100), lesson instructions, and an interactive code assembly zone (provide both clickable standard code snippet buttons and a simplified editable text area).
   - **Right Panel:** Simulated Java Console output box with a prominent "Run Code" button.
3. **Java Simulator Engine (Client-Side JS):**
   - Parse and execute basic Java-like commands directly in JavaScript.
   - Support `System.out.println(...)`, String concatenation with `+`, integer variable declarations (`int x = 5;`), simple arithmetic, and basic `if` statements.
   - Display clear syntax errors or stdout messages in the console box.
4. **Kid-Friendly Design:** Large fonts (20px+), high-contrast colors, clear button states, clear padding, and readable monospaced font for code snippets.
5. **Persistence:** Use browser `localStorage` to automatically save completed levels and user progress across browser restarts. Include a "Reset Progress" button in the footer.
6. **Data Structure:** Define a central JavaScript array named `levels` containing level objects formatted like this:
   ```javascript
   {
     id: 1,
     title: "Your First Output",
     instruction: "In Java, we print text using System.out.println(). Click the button or type the code to print 'Hello'.",
     startingCode: 'System.out.println("Hello");',
     expectedOutput: "Hello"
   }