import bcrypt from "bcrypt";

const bcryptUtil = {
    async compareData(unhashData: string, hashData: string) {
        return bcrypt.compare(unhashData, hashData);
    },

    async hashData(data: string) {
        return bcrypt.hashSync(data, 10);
    }
}

export default bcryptUtil;