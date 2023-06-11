export class GroupModel {
  id: string | number;
  name: string;

  constructor(data: Partial<GroupModel>) {
    Object.assign(this, data);
  }
}
