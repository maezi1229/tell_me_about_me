class GroupsController < ApplicationController

  def index
  end
  
  def new
    @group = Group.new
    # 配列に要素を追加
    # グループを新規作成する時はログイン中のユーザーを必ず含めたいためあらかじめ追加
    @group.users << current_user
  end

  def create
    @group = Group.new(group_params)
    if @group.save
      redirect_to root_path, notice: 'グループを作成しました'
    else
      render :new
    end
  end

  def edit
    @group = Group.find(params[:id])
  end

  def update
    @group = Group.find(params[:id])
    if @group.update(group_params)
      redirect_to group_messages_path(@group), notice: 'グループを更新しました'
    else
      render :edit
    end
  end

  private
  def group_params
    # 配列に対して保存を許可したい場合は、キーの名称と関連づけてバリューに「[]」と記述します。
    params.require(:group).permit(:name, user_ids: [])
  end

end
