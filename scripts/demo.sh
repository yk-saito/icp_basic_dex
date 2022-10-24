#!/bin/bash

dfx deploy icp_basic_dex_backend

# ===== Create demo user =====
dfx identity new --disable-encryption user1
dfx identity use user1
export USER1_PRINCIPAL=$(dfx identity get-principal)

dfx identity new --disable-encryption user2
dfx identity use user2
export USER2_PRINCIPAL=$(dfx identity get-principal)

# ===== Set Token =====
dfx identity use default

dfx canister call HogeDIP20 mint '(principal '\"$USER1_PRINCIPAL\"', 1000000)'
dfx canister call PiyoDIP20 mint '(principal '\"$USER1_PRINCIPAL\"', 1000000)'

dfx canister call HogeDIP20 mint '(principal '\"$USER2_PRINCIPAL\"', 1000000)'
dfx canister call PiyoDIP20 mint '(principal '\"$USER2_PRINCIPAL\"', 1000000)'

# ===== Check user Token =====
dfx canister call HogeDIP20 balanceOf '(principal '\"$USER1_PRINCIPAL\"')'
## (1_000_000 : nat)
dfx canister call PiyoDIP20 balanceOf '(principal '\"$USER1_PRINCIPAL\"')'
## (1_000_000 : nat)
dfx canister call HogeDIP20 balanceOf '(principal '\"$USER2_PRINCIPAL\"')'
## (1_000_000 : nat)
dfx canister call PiyoDIP20 balanceOf '(principal '\"$USER2_PRINCIPAL\"')'
## (1_000_000 : nat)

# Check DEX Token
export DEX_PRINCIPAL=$(dfx canister id icp_basic_dex_backend)
dfx canister call PiyoDIP20 balanceOf '(principal '\"$DEX_PRINCIPAL\"')'
## (0 : nat)

# ===== TEST deposit (user1 -> DEX) =====
export HogeDIP20_PRINCIPAL=$(dfx canister id HogeDIP20)
export PiyoDIP20_PRINCIPAL=$(dfx canister id PiyoDIP20)

# depositを行うユーザーに切り替え
dfx identity use user1

# approveをコールして、DEXがユーザーの代わりにdepositすることを許可する
dfx canister call HogeDIP20 approve '(principal '\"$DEX_PRINCIPAL\"', 100000)'

# deposit
echo '===== deposit() ====='
dfx canister call icp_basic_dex_backend deposit '(principal '\"$HogeDIP20_PRINCIPAL\"')'
## (variant { Ok = 100_000 : nat })

# user1の残高チェック
dfx canister call HogeDIP20 balanceOf '(principal '\"$USER1_PRINCIPAL\"')'
## (980_000 : nat)

# DEXの残高チェック
dfx canister call HogeDIP20 balanceOf '(principal '\"$DEX_PRINCIPAL\"')'
## (100_000 : nat)

# user1がDEXに預けたトークンのデータを確認
echo '===== getBalances() ====='
dfx canister call icp_basic_dex_backend getBalances

# ===== TEST withdraw (DEX -> user1) =====
echo '===== withdraw() ====='
dfx canister call icp_basic_dex_backend withdraw '(principal '\"$HogeDIP20_PRINCIPAL\"', 10000, principal '\"$USER1_PRINCIPAL\"')'

# user1の残高チェック
dfx canister call HogeDIP20 balanceOf '(principal '\"$USER1_PRINCIPAL\"')'
## (990_000 : nat)

# DEXの残高チェック
dfx canister call HogeDIP20 balanceOf '(principal '\"$DEX_PRINCIPAL\"')'
## (80_000 : nat)

# user1がDEXに預けたトークンのデータが更新されているか確認
echo '===== getBalances() ====='
dfx canister call icp_basic_dex_backend getBalances

# ===== 後始末 =====
dfx identity use default
dfx identity remove user1
dfx identity remove user2