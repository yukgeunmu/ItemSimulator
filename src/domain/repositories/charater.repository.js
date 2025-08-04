export class CharacterRepository{
    async findById(characterId){
        throw new Error('CharacterRepository.findById is not implemented');
    }

    async findAllByAccountId(accountId){
        throw new Error('CharacterRepository.findAllByAccountId is not implemented');
    }

    async create(accountId ,character){
        throw new Error('CharacterRepository.create is not implementd');
    }

    async delete(characterId){
         throw new Error('CharacterRepository.delete is not implementd');
    }
}