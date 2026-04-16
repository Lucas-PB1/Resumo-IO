import { db } from "@/lib/firebase/config"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore"
import { storage } from "@/lib/firebase/storage"
import { ref, deleteObject } from "firebase/storage"

export interface GeneratedDocument {
  id?: string
  templateId: string
  templateName: string
  fileName: string
  fileUrl: string // gs:// or https://
  storagePath: string
  ownerId: string
  category?: string
  subcategory?: string
  authorId?: string
  authorName?: string
  formData?: Record<string, any>
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

  async deleteDocument(id: string, storagePath: string) {
    // Delete from Firestore first
    await deleteDoc(doc(db, DOCUMENTS_COLLECTION, id))

    // Attempt to delete from Storage if path exists
    if (storagePath && storagePath.trim() !== "") {
      try {
        const storageRef = ref(storage, storagePath)
        await deleteObject(storageRef)
      } catch (err) {
        console.warn(
          "Could not delete physical file from Storage, it might have been moved or already deleted.",
          err
        )
      }
    }
  },

  async updateDocument(id: string, updates: Partial<GeneratedDocument>) {
    const docRef = doc(db, DOCUMENTS_COLLECTION, id)
    await updateDoc(docRef, updates)
  },
}
