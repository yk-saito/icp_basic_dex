#!/bin/bash

# Remove old content.
dfx stop
rm -rf .dfx

#ROOT_HOME=$(mktemp -d)
#ROOT_PUBLIC_KEY="principal \"$( \
#    HOME=$ROOT_HOME dfx identity get-principal
#)\""
#echo ROOT ID = $ROOT_PUBLIC_KEY

export ROOT_PRINCIPAL="principal \"$(\
    dfx identity get-principal
)\""

echo $ROOT_PRINCIPAL

# ---TODO: DELETE---
dfx start --clean --background
# -------------------
dfx canister create HogeDIP20
dfx canister create PiyoDIP20

dfx build HogeDIP20
dfx build PiyoDIP20

# deploy token
# Installs compiled code in a canister.
dfx canister install HogeDIP20 --argument="(\"Token Hoge Logo\", \"Token Hoge\", \"THG\", 8, 10000000000000000, $ROOT_PRINCIPAL, 10000)"
dfx canister install PiyoDIP20 --argument="(\"Token Piyo Logo\", \"Token Piyo\", \"TPY\", 8, 10000000000000000, $ROOT_PRINCIPAL, 10000)"

# set fees
