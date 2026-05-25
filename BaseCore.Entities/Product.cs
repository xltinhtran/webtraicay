using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class Product
{
    public int Id { get; set; }

    public int CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public decimal Price { get; set; }

    public decimal? DiscountPrice { get; set; }

    public int Stock { get; set; }

    public string Weight { get; set; } = null!;

    public string? CountryOfOrigin { get; set; }

    public string? Quality { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsFeatured { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual ICollection<ProductReview> ProductReviews { get; set; } = new List<ProductReview>();
}
