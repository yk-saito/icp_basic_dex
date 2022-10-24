import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";

import Book "book";

actor class Dex() = this {

  type DepositReceipt = {
    #Ok : Nat;
    // #Err : DepositErr;
    #Err : {
      #BalanceLow;
      #TransferFailure;
    };
  };

  type WithdrawReceipt = {
    #Ok : Nat;
    // #Err : WithdrawErr;
    #Err : {
      #BalanceLow;
      #TransferFailure;
    };
  };

  type Balance = {
    owner : Principal;
    token : Principal;
    amount : Nat;
  };

  // ===== DIP20 TOKEN INTERFACE =====
  type TxReceipt = {
    #Ok : Nat;
    #Err : {
      #InsufficientAllowance;
      #InsufficientBalance;
      #ErrorOperationStyle;
      #Unauthorized;
      #LedgerTrap;
      #ErrorTo;
      #Other : Text;
      #BlockUsed;
      #AmountTooSmall;
    };
  };

  type Metadata = {
    logo : Text;
    name : Text;
    symbol : Text;
    decimals : Nat8;
    totalSupply : Nat;
    owner : Principal;
    fee : Nat;
  };

  type DIPInterface = actor {
    allowance : (owner : Principal, spender : Principal) -> async Nat;
    faucet : (to : Principal, value : Nat) -> async TxReceipt;
    getMetadata : () -> async Metadata;
    mint : (to : Principal, value : Nat) -> async TxReceipt;
    transfer : (to : Principal, value : Nat) -> async TxReceipt;
    transferFrom : (from : Principal, to : Principal, value : Nat) -> async TxReceipt;
  };

  // ユーザーの残高を管理するモジュール
  private var book = Book.Book();

  public shared (msg) func deposit(token : Principal) : async DepositReceipt {
    Debug.print(
      "Message caller: " # Principal.toText(msg.caller) # "| Deposit Token: " # Principal.toText(token),
    );

    // tokenをDIP20のアクターにキャスト
    let dip20 = actor (Principal.toText(token)) : DIPInterface;

    // DIPのfeeを取得
    let dip_fee = await fetch_dif_fee(token);

    // DIP20のallowanceで残高を取得
    // `Principal.fromActor(this)`: DEXキャニスター（main.mo）自身
    let balance = await dip20.allowance(msg.caller, Principal.fromActor(this));

    // DEXへユーザーの資金を送る
    let token_reciept = if (balance > dip_fee) {
      await dip20.transferFrom(msg.caller, Principal.fromActor(this), balance - dip_fee);
    } else {
      return #Err(#BalanceLow);
    };

    // `transferFrom()`の結果をチェック
    switch token_reciept {
      case (#Err e) {
        return #Err(#TransferFailure);
      };
      case _ {};
    };

    let available = balance - dip_fee;

    // `book`にユーザーとトークンを追加
    book.addTokens(msg.caller, token, available);

    return #Ok(balance - dip_fee);
  };

  public shared (msg) func withdraw(token : Principal, amount : Nat, address : Principal) : async WithdrawReceipt {
    // TODO: ユーザーが登録したオーダーを削除

    // キャニスターIDをDIP20Interfaceにキャスト
    let dip20 = actor (Principal.toText(token)) : DIPInterface;

    // ユーザーへトークンを送る
    let txReceipt = await dip20.transfer(address, amount);

    switch txReceipt {
      case (#Err e) {
        return #Err(#TransferFailure);
      };
      case _ {};
    };

    // DIPのfeeを取得
    let dip_fee = await fetch_dif_fee(token);
    // `book`から引き出した分のトークンデータを削除
    switch (book.removeTokens(msg.caller, token, amount + dip_fee)) {
      case (null) {
        return #Err(#BalanceLow);
      };
      case _ {};
    };

    return #Ok(amount);
  };

  // Internal functions
  private func fetch_dif_fee(token : Principal) : async Nat {
    let dip20 = actor (Principal.toText(token)) : DIPInterface;
    let metadata = await dip20.getMetadata();
    metadata.fee;
  };

  // ===== DEX STATE FUNCTIONS =====
  // ユーザーがDEXに預けたトークンの残高を取得する
  public shared query (msg) func getBalances() : async [Balance] {
    switch (book.get(msg.caller)) {
      case (?token_balance) {
        // 配列の値の順番を保ったまま、関数で各値を変換する(`(Principal, Nat)` -> `Balace`)。
        Array.map<(Principal, Nat), Balance>(
          Iter.toArray(token_balance.entries()),
          func(key : Principal, value : Nat) : Balance {
            {
              owner = msg.caller;
              token = key;
              amount = value;
            };
          },
        );
      };
      case (null) {
        return [];
      };
    };
  };
};
