# Web UI (for demo and acceptance testing)
web: bin/dbmigrate up && node build/app/web/boot.js

# Logs messages on all Kafka topics (for debugging)
# firehose: node build/lib/firehose/boot.js

# Simulates random messages (for development and testing)
# simulator: node build/test/simulation.js

# Runs a local SFTP server (for development and testing)
sftp-server: node build/test/sftp_server.js

# Starts users topic listener
topic-listener-1: node build/app/kafka/topic_listener.js users

# Starts offers topic listener
topic-listener-2: node build/app/kafka/topic_listener.js offers

# Starts transactions topic listener
topic-listener-3: node build/app/kafka/topic_listener.js transactions

# Starts users topic listener in case we want more than 10 dynos
topic-listener-1b: node build/app/kafka/topic_listener.js users

# Starts transactions topic listener in case we want more than 10 dynos
topic-listener-3b: node build/app/kafka/topic_listener.js transactions

# manually run the transaction processing process
run-processing: node build/app/scheduler/boot.js