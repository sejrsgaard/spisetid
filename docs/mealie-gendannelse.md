# Gendannelse af Mealie

Mealie kører på Hetzner-serveren `2.31.125.171` (`ssh hetzner`) og er tilgængelig på https://spisetid.dalmosen.dk. Opsætningen ligger i [`server/mealie/`](../server/mealie/).

## Hvad bliver taget backup af

Hver nat kl. 03:30 kører `mealie-backup.timer` scriptet `/usr/local/bin/mealie-backup`. Det skriver til Hetzner-disken `volume-nbg1-1`, som er monteret på `/mnt/HC_Volume_107253356`:

```
/mnt/HC_Volume_107253356/mealie-backups/mealie-ÅÅÅÅ-MM-DD.tar.gz
```

- Arkivet indeholder hele Mealies datamappe: databasen `mealie.db` (opskrifter, madplaner, indkøbslister og brugere), billederne i `recipes/` og nøglerne `.secret` og `.session_secret`.
- Backups gemmes i 7 dage.
- Kør en backup manuelt med `ssh hetzner systemctl start mealie-backup.service`.
- Se log med `ssh hetzner journalctl -u mealie-backup.service`.

Disken står i samme datacenter som serveren. Den overlever, hvis serveren slettes, men ikke hvis disken selv slettes.

## Gendan på den eksisterende server

Brug dette, hvis data i Mealie er blevet ødelagt eller slettet ved en fejl.

```sh
ssh hetzner
ls -lt /mnt/HC_Volume_107253356/mealie-backups/      # vælg en dato

cd /opt/mealie
docker compose stop mealie

DATA=/var/lib/docker/volumes/mealie_mealie-data/_data
mv "$DATA" "$DATA.$(date +%F-%H%M).old"              # behold de nuværende data, til gendannelsen er tjekket
mkdir "$DATA"
tar -xzf /mnt/HC_Volume_107253356/mealie-backups/mealie-<dato>.tar.gz -C "$DATA"
chown -R 1000:1000 "$DATA"

docker compose start mealie
```

Tjek at https://spisetid.dalmosen.dk viser opskrifterne, og slet derefter `$DATA.*.old`.

## Genopbyg på en ny server

Brug dette, hvis serveren er væk, men disken `volume-nbg1-1` findes endnu.

1. Opret en Ubuntu-server i Hetzner (nbg1), og tilknyt disken `volume-nbg1-1` med automatisk montering. Vælg SSH-nøglen `hetzner-vps`.
2. Peg DNS-recordsene `dalmosen.dk` og `*.dalmosen.dk` på den nye IP-adresse, og ret `HostName` under `Host hetzner` i `~/.ssh/config`.
3. Installer pakkerne og firewallen:
   ```sh
   ssh hetzner 'apt-get update && apt-get install -y docker.io docker-compose-v2 sqlite3 ufw &&
     ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable'
   ```
4. Kopier opsætningen fra dette repo:
   ```sh
   ssh hetzner mkdir -p /opt/mealie
   scp server/mealie/compose.yaml server/mealie/Caddyfile hetzner:/opt/mealie/
   scp server/mealie/mealie-backup hetzner:/usr/local/bin/
   scp server/mealie/mealie-backup.service server/mealie/mealie-backup.timer hetzner:/etc/systemd/system/
   ```
   Disken kan få et nyt navn ved montering. Ret i så fald stien `/mnt/HC_Volume_107253356` i `mealie-backup` og i kommandoerne nedenfor.
5. Opret volumen, gendan data, og start:
   ```sh
   ssh hetzner
   cd /opt/mealie
   docker compose create                              # opretter tomme volumes uden at starte noget
   DATA=$(docker volume inspect -f '{{.Mountpoint}}' mealie_mealie-data)
   tar -xzf /mnt/HC_Volume_107253356/mealie-backups/mealie-<dato>.tar.gz -C "$DATA"
   chown -R 1000:1000 "$DATA"
   docker compose up -d
   systemctl daemon-reload && systemctl enable --now mealie-backup.timer
   ```
6. Slå SSH-login med adgangskode fra:
   ```sh
   ssh hetzner 'printf "PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n" > /etc/ssh/sshd_config.d/00-key-only.conf && sshd -t && systemctl reload ssh'
   ```

Caddy henter selv nye certifikater, når DNS peger på serveren. API-tokenet i macOS Keychain (`mealie-spisetid`) virker stadig, fordi det ligger i den gendannede database.
