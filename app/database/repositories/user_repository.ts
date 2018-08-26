import { UserRecord } from "../records/user_record";
import { UserSerializer } from "../serializers/user_serializer";
import { IUser } from "../../models/user";
import { Repository } from "./repository";

class RepositoryForUsers extends Repository<IUser> {
  constructor(record = UserRecord, serializer = UserSerializer) {
    super(record, serializer);
  }
}

export const UserRepository = new RepositoryForUsers();
