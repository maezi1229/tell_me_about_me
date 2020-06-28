class CreateGroups < ActiveRecord::Migration[5.0]
  def change
    create_table :groups do |t|
      # NOT NULL制約
      t.string :name, null: false
      # 一意性制約
      t.index :name, unique: true
      t.timestamps
    end
  end
end


# NOT NULL制約 そのカラムの値にはNULL（空の値）を入れることができなくなります。絶対に値が必要のあるカラムに対して使う制約です。
# 一意性制約 一意性制約を設定したカラムには同じ値を設定できなくなります。
# add_index :テーブル名, :カラム名, unique: true



