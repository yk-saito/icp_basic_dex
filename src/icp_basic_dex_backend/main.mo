import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

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

  // ===== DIP20 token interface =====
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

    // TODO: `book`にユーザーとトークンを追加

    return #Ok(balance - dip_fee);
  };

  public shared (msg) func withdraw(token : Principal, amount : Nat, address : Principal) : async WithdrawReceipt {
    // TODO: ユーザーが登録したオーダーを削除

    // キャニスターIDをDIP20Interfaceにキャスト
    let dip20 = actor (Principal.toText(token)) : DIPInterface;

    // DIPのfeeを取得
    // let dip_fee = await fetch_dif_fee(token);

    // ユーザーへトークンを送る
    let txReceipt = await dip20.transfer(address, amount);

    switch txReceipt {
      case (#Err e) {
        return #Err(#TransferFailure);
      };
      case _ {};
    };

    // TODO: `book`からトークンのデータを削除

    return #Ok(amount);
  };

  // Internal functions
  private func fetch_dif_fee(token : Principal) : async Nat {
    let dip20 = actor (Principal.toText(token)) : DIPInterface;
    let metadata = await dip20.getMetadata();
    metadata.fee;
  };
};
