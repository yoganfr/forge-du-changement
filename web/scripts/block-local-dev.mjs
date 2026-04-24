const message = [
  "",
  "Lancement local de web désactivé pour protéger la machine.",
  "Cette commande a déjà provoqué une cascade de processus Node (overflow mémoire).",
  "",
  "Commande bloquée : npm run dev",
  "Si tu dois vraiment lancer localement, utilise explicitement :",
  "  npm run dev:manual",
  "",
].join("\n");

process.stderr.write(message);
process.exit(1);
