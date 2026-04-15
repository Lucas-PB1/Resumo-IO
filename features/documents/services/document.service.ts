import { db } from "@/lib/firebase/config"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore"

export interface GeneratedDocument {
  id?: string
  templateId: string
  templateName: string
  fileName: string
  fileUrl: string // gs:// or https://
  ownerId: string
  createdAt: any
}

const DOCUMENTS_COLLECTION = "generated_docs"

export const documentService = {
  async saveGeneratedDocument(
    docData: Omit<GeneratedDocument, "id" | "createdAt">
  ) {
    const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), {
      ...docData,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  async getDocuments(userId: string) {
    const q = query(
      collection(db, DOCUMENTS_COLLECTION),
      where("ownerId", "==", userId),
      orderBy("createdAt", "desc")
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GeneratedDocument[]
  },
}
