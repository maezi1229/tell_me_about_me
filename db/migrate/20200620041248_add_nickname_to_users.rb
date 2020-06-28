class AddNicknameToUsers < ActiveRecord::Migration[5.0]
  def change
    add_column :users, :image_name, :string, null: false
end



