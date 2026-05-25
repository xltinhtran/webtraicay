using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class ProductReview
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string UserName { get; set; } = null!;

    public string? UserImage { get; set; }

    public int Rating { get; set; }

    public string Comment { get; set; } = null!;

    public DateTime ReviewDate { get; set; }

    public virtual Product Product { get; set; } = null!;
}
