import cookiePermission from "../scheme/cookiePermission.js";
import cloudCookie from "../scheme/cloudCookie.js";

class permissionService {
    static async create(data) {
        return cookiePermission.create(data);
    }

    static async findPermissionUser(userId) {
        return cookiePermission.findOne({ user: userId });
    }

    static async delete(userId) {
        return cookiePermission.deleteOne({user: userId});
    }

}

export default permissionService;
