import { combineResolvers } from 'graphql-resolvers';
import { isAuthenticated, isDocumentOwner } from './authorization';

export default {
  Query: {
    getDocument: combineResolvers(
      isAuthenticated,
      async (_, args, { models }) => {
        try {
          const response = await models.Documents.findById(args.id);
          return response;
        } catch (error) {
          return new Error(error.message);
        }
      }
    ),

    getAllDocuments: combineResolvers(
      isAuthenticated,
      async (_, args, { models }) => await models.Documents.find({}).exec()
    )
  },

  Mutation: {
    createDocument: combineResolvers(
      isAuthenticated,
      async (_, args, { models, user }) => {
        try {
          const { title, content, access = 'PUBLIC' } = args;
          const newDocument = await models.Documents.create({
            title,
            content,
            access,
            owner: user.id
          });
          return newDocument;
        } catch (error) {
          throw new Error(error);
        }
      }
    ),

    updateDocument: combineResolvers(
      isAuthenticated,
      isDocumentOwner,
      async (_, args, { models }) => {
        try {
          const updatedDocument = await models.Documents.findByIdAndUpdate(
            args.id,
            args,
            { new: true }
          );
          if (!updatedDocument) {
            throw new Error('Document could not be updated');
          }
          return updatedDocument;
        } catch (error) {
          throw new Error(error.message);
        }
      }
    ),

    deleteDocument: combineResolvers(
      isAuthenticated,
      isDocumentOwner,
      async (_, args, { models }) => {
        try {
          const documentFound = await models.Documents.findByIdAndDelete(
            args.id
          );
          if (documentFound) {
            return { message: 'Document deleted' };
          }
          throw new Error('Document does not exist');
        } catch (error) {
          throw new Error(error.message);
        }
      }
    )
  },

  DocumentType: {
    owner: async (document, args, { models }) => {
      return await models.Users.findOne({ _id: document.owner });
    }
  }
};
