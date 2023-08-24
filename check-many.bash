#!/bin/bash

# Path to the Node.js executable
NODE_EXECUTABLE="node"

# Path to the command.js script
COMMAND_SCRIPT="dist/triggers/command.js"

# Input file containing list of addresses (one address per line)
ADDRESS_FILE="address_list.txt"

# Read each line from the address file and execute the command
while IFS= read -r address; do
    echo "Running command for address: $address"
    $NODE_EXECUTABLE $COMMAND_SCRIPT collection check "$address"
done < "$ADDRESS_FILE"
