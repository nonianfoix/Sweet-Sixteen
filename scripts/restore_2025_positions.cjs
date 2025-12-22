const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, '../data/realNbaDrafts.ts');

const positions2025 = {
    "Cooper Flagg": "F",
    "Dylan Harper": "GF",
    "VJ Edgecombe": "SF",
    "Kon Knueppel": "F",
    "Ace Bailey": "SF",
    "Tre Johnson": "SG",
    "Jeremiah Fears": "G",
    "Egor Dёmin": "SF",
    "Collin Murray-Boyles": "F",
    "Khaman Maluach": "C",
    "Cedric Coward": "F",
    "Noa Essengue": "F",
    "Derik Queen": "C",
    "Carter Bryant": "F",
    "Thomas Sorber": "FC",
    "Yang Hansen": "C",
    "Joan Beringer": "C",
    "Walter Clayton": "PG",
    "Nolan Traoré": "PG",
    "Kasparas Jakucionis": "G",
    "Will Riley": "F",
    "Drake Powell": "F",
    "Asa Newell": "PF",
    "Nique Clifford": "F",
    "Jase Richardson": "G",
    "Ben Saraf": "G",
    "Danny Wolf": "C",
    "Hugo González": "C",
    "Liam McNeeley": "F",
    "Yanic Konan Niederhauser": "F",
    "Rasheer Fleming": "F",
    "Noah Penda": "F",
    "Sion James": "PG",
    "Ryan Kalkbrenner": "C",
    "Johni Broome": "C",
    "Adou Thiero": "G",
    "Chaz Lanier": "G",
    "Kam Jones": "F",
    "Alijah Martin": "PG",
    "Micah Peavy": "SF",
    "Koby Brea": "GF",
    "Maxime Raynaud": "C",
    "Jamir Watkins": "F",
    "Brooks Barnhizer": "SF",
    "Rocco Zikarsky": "C",
    "Amari Williams": "PF",
    "Bogoljub Markovic": "SF",
    "Javon Small": "G",
    "Tyrese Proctor": "PG",
    "Kobe Sanders": "F",
    "Mohamed Diawara": "PF",
    "Alex Toohey": "F",
    "John Tonje": "GF",
    "Taelon Peter": "G",
    "Lachlan Olbrich": "C",
    "Will Richard": "F",
    "Max Shulga": "G",
    "Saliou Niang": "SF",
    "Jahmai Mashack": "F"
};

let tsContent = fs.readFileSync(tsPath, 'utf-8');

// Iterate over the map and replace positions
// Pattern: player: "Name", ... position: ""
// Replacement: player: "Name", ... position: "Pos"

for (const [player, pos] of Object.entries(positions2025)) {
    // We need to match the specific player block.
    // Since we generated the file, we know the format:
    // player: "Name",
    // college: "...",
    // position: ""
    
    // We can use a regex that matches the player line and captures up to position
    const regex = new RegExp(`(player: "${player}",[\\s\\S]*?position: ")([^"]*)(")`);
    
    if (regex.test(tsContent)) {
        tsContent = tsContent.replace(regex, `$1${pos}$3`);
    } else {
        console.log(`Could not find entry for ${player}`);
    }
}

fs.writeFileSync(tsPath, tsContent);
console.log("Restored 2025 positions.");
