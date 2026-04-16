import { db } from "@/lib/firebase/config"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  query,
  where,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"

export interface Category {
  id: string
  name: string
  subcategories: string[]
  ownerId: string
}

const TAXONOMY_COLLECTION = "taxonomy"

export const taxonomyService = {
  async getCategories(userId: string) {
    const q = query(
      collection(db, TAXONOMY_COLLECTION),
      where("ownerId", "==", userId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[]
  },

  async addCategory(name: string, userId: string) {
    const docRef = await addDoc(collection(db, TAXONOMY_COLLECTION), {
      name,
      subcategories: [],
      ownerId: userId,
    })
    return docRef.id
  },

  async deleteCategory(id: string) {
    await deleteDoc(doc(db, TAXONOMY_COLLECTION, id))
  },

  async addSubcategory(categoryId: string, name: string) {
    const docRef = doc(db, TAXONOMY_COLLECTION, categoryId)
    await updateDoc(docRef, {
      subcategories: arrayUnion(name),
    })
  },

  async deleteSubcategory(categoryId: string, name: string) {
    const docRef = doc(db, TAXONOMY_COLLECTION, categoryId)
    await updateDoc(docRef, {
      subcategories: arrayRemove(name),
    })
  },
}
