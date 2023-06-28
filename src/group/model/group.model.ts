export class GroupModel {
  id: string | number;
  name: string;

  constructor(data: Partial<GroupModel>) {
    this.id = data.id;
    this.name = data.name;
  }
}
