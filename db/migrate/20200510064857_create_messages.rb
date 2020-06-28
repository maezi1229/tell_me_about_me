class CreateMessages < ActiveRecord::Migration[5.0]
  def change
    create_table :messages do |t|
      # t.カラムの型  :カラム名
      t.string :content
      # 外部キー制約
      t.references :group, foreign_key: true
      t.references :user, foreign_key: true
      t.timestamps
    end
  end
end

# テーブルにカラムを追加するとき
# add_column  :テーブル名, :カラム名, :型