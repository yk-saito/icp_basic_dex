import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";

import T "types";

module {
    public class Book() {

        // ユーザーとトークンの種類・量をマッピング
        // 0 : initCapacity
        // Principal.equal : keyEq
        // Principal.hash : keyHash
        var book = HashMap.HashMap<Principal, HashMap.HashMap<T.Token, Nat>>(0, Principal.equal, Principal.hash);

        // Principal(`user`)に紐づいたトークンと残高を取得
        public func get(user : Principal) : ?HashMap.HashMap<T.Token, Nat> {
            return book.get(user);
        };

        // ユーザーの預け入れを記録する
        public func addTokens(user : Principal, token : T.Token, amount : Nat) {
            // ユーザーのデータがあるかどうか
            switch (book.get(user)) {
                // ユーザーデータあり
                case (?token_balance) {
                    // トークンが記録されているかどうか
                    switch (token_balance.get(token)) {
                        // 記録あり
                        case (?balance) {
                            token_balance.put(token, balance + amount);
                        };
                        // 記録なし
                        case (null) {
                            token_balance.put(token, amount);
                        };
                    };
                };
                // ユーザーデータなし
                case (null) {
                    var new_data = HashMap.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);
                    new_data.put(token, amount);
                    book.put(user, new_data);
                };
            };
        };

        // DEXからトークンを引き出す際に呼び出される関数。更新された残高を返す。
        public func removeTokens(user : Principal, token : T.Token, amount : Nat) : ?Nat {
            // ユーザーのデータがあるかどうか
            switch (book.get(user)) {
                // ユーザーデータあり
                case (?token_balance) {
                    // トークンが記録されているかどうか
                    switch (token_balance.get(token)) {
                        // 記録あり
                        case (?balance) {
                            if (balance >= amount) {
                                // 残高と引き出す量が等しい時はトークンのデータごと削除
                                if (balance == amount) {
                                    token_balance.delete(token);
                                    // 残高の方が多い時は差し引いた分を再度保存
                                } else {
                                    token_balance.put(token, balance - amount);
                                };
                                return ?(balance - amount);
                                // 残高不足の時
                            } else {
                                return (null);
                            };
                        };
                        // 記録なし
                        case (null) {
                            return (null);
                        };
                    };
                };
                // ユーザーデータなし
                case (null) {
                    return (null);
                };
            };
        };

        // ユーザーが`book`内に`amount`分のトークンを保有しているかをチェックする
        public func hasEnoughBalance(user : Principal, token : T.Token, amount : Nat) : Bool {
            // ユーザーデータがあるかどうか
            switch (book.get(user)) {
                // ユーザーデータあり
                case (?token_balance) {
                    // トークンが記録されているかどうか
                    switch (token_balance.get(token)) {
                        // 記録あり
                        case (?balance) {
                            // `amount`以上残高ありで`true`、なしで`false`を返す
                            return (balance >= amount);
                        };
                        // 記録なし
                        case (null) {
                            return (false);
                        };
                    };
                };
                // ユーザーデータなし
                case (null) {
                    return (false);
                };
            };
        };
    };
};
