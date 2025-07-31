
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const PlaceCard = ({ item, onPlaceClick, onDelete, showDeleteButton = false, isDragging = false }) => {
  
  const getImageUrl = () => {
    if (item.photoUrl) {
      return item.photoUrl;
    }
    if (item.imageUrl) {
      return item.imageUrl;
    }
    return 'https://picsum.photos/150/150';
  };

  const handleImageError = () => {
    console.log('Image failed to load for item:', item.name);
  };

  return (
    <View style={[styles.card, isDragging && styles.draggingCard]}>
      <View style={styles.cardTouchable}>
        <Image
          style={styles.placeImage}
          source={{ uri: getImageUrl() }}
          onError={handleImageError}
        />
        <View style={styles.cardContent}>
          <Text style={styles.placeName}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
        </View>
      </View>
      

      
      {showDeleteButton && (
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => onDelete && onDelete(item)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    height: 110,
    position: 'relative',
  },
  draggingCard: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTouchable: {
    flexDirection: 'row',
    flex: 1,
  },
  placeImage: {
    width: 100,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    padding: 10,
    flex: 1,
    justifyContent: 'center',
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: '#888',
  },

  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});

export default PlaceCard;
