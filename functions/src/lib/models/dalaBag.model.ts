export interface DalaBag {
  id: string;
  title: string;
  description: string;
  price: number;
  quantityAvailable: number;
  collectionStartTime: Date;
  collectionEndTime: Date;
  imageUrl: string;
  vendorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddEditDalaBagFormProps {
  vendorId: string;
  existingDalaBag?: DalaBag;
  onClose: () => void;
}
